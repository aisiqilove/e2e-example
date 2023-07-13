/* eslint-disable no-console */
// import fs from 'fs';
// import os from 'os';
// import path from 'path';

// import axios from 'axios';
import type { JSONReport, JSONReportSuite } from '@playwright/test/reporter';

import { getMiniReportTitle, getModuleMatches, getModuleSource } from './ci-module-map';
const fs = require('fs')
const os = require('os')
const path = require('path')
const {minimatch} = require('minimatch')

const reportDir = path.resolve(__dirname, '../playwright-report');
const resultJsonFile = path.resolve(reportDir, 'results.json');
const miniTestExportJsonFile = path.resolve(reportDir, 'mini_test_report.json');
const resultExportFile = path.resolve(reportDir, 'results-export.sh');
// const postHost = '';

// const ignorePostPassRate = !!process.env.E2E_IGNORE_POST_PASS_RATE;

const readResultJson = (): JSONReport | undefined => {
  if (!fs.existsSync(resultJsonFile)) {
    return;
  }

  return JSON.parse(fs.readFileSync(resultJsonFile, 'utf8'));
};

const summaryPassRateShell = (resultJson: JSONReport, extraShellText: string) => {
  if (os.platform() === 'win32') {
    return;
  }

  let passed = 0;
  let failed = 0;

  const walkSuites = (suites?: JSONReportSuite[]) => {
    suites?.forEach(suite => {
      suite.specs.forEach(spec => {
        // 用例执行结果
        const { ok } = spec;

        if (ok) {
          passed += 1;
        } else {
          failed += 1;
        }
      });

      walkSuites(suite.suites);
    });
  };

  walkSuites(resultJson.suites);

  const total = passed + failed;
  const passedPercent = total ? `${((passed * 100) / total).toFixed(1)}%` : 'NaN%';
  const passedRate = total ? (passed / total).toFixed(3) : 0;

  console.log(`passed ${passed}, failed ${failed}, passed percent ${passedPercent}`);

  fs.writeFileSync(
    resultExportFile,
    `
#!/bin/sh
export E2E_TEST_RESULT_PASSED=${passed}
export E2E_TEST_RESULT_FAILED=${failed}
export E2E_TEST_RESULT_PASSED_PERCENT=${passedPercent}
export E2E_TEST_RESULT_PASSED_RATE=${passedRate}
${extraShellText}
`,
  );
};

// 兼容 mini-test-report html
type MiniTestResult = {
  caseId: string;
  caseName: string;
  casePath: string;
  caseLocation?: string;
  fullName: string;
  replayResult: 'failed' | 'passed';
  replayResults: [];
  duration?: number;
};

type ModuleMatch = ReturnType<typeof getModuleMatches>[0];

type ModuleResult = ModuleMatch & {
  passed: number;
  failed: number;
  testResults: MiniTestResult[];
};

const findMatchModule = (suite: JSONReportSuite, moduleResults: ModuleResult[]) => {
  for (const module of moduleResults) {
    const { patterns } = module;

    // 最后一个
    if (!patterns) {
      return module;
    }

    // 正常匹配
    const matched = patterns.some(pattern => minimatch(suite.file, pattern));

    if (matched) {
      return module;
    }
  }

  return null;
};

const reportModulePassRate = async (resultJson: JSONReport, moduleResults: ModuleResult[]) => {
  // 统计 passed failed

  const walkSuites = (suites?: JSONReportSuite[]) => {
    suites?.forEach(suite => {
      const module = findMatchModule(suite, moduleResults);

      if (!module) {
        return;
      }

      suite.specs.forEach(spec => {
        // 用例执行结果
        const { id, title, ok, file, line, column, tests } = spec;

        if (ok) {
          module.passed += 1;
        } else {
          module.failed += 1;
        }

        const results = tests[tests.length - 1]?.results || [];

        const testResult: MiniTestResult = {
          caseId: id,
          caseName: title,
          casePath: file,
          caseLocation: `${file}:${line}:${column}`,
          fullName: title,
          replayResult: ok ? 'passed' : 'failed',
          replayResults: [],
          duration: results[results.length - 1]?.duration,
        };

        module.testResults.push(testResult);
      });

      walkSuites(suite.suites);
    });
  };

  walkSuites(resultJson.suites);

  // 生成结果reporter json
  fs.writeFileSync(
    miniTestExportJsonFile,
    JSON.stringify({ type: 'playwright', title: getMiniReportTitle(), moduleResults }, undefined, 2),
  );

  // 上报 modulePassMap
  console.log('moduleResults', moduleResults);
  const postData = moduleResults
    .map(module => {
      const { failed, passed, teamTag, expectTotal } = module;
      const total = passed + failed;
      const passedRate = total ? passed / total : 0;

      return {
        tag: teamTag,
        module: module.name,
        caseCount: total,
        autoTestCaseCount: total,
        autoTestCasePassCount: passed,
        passRate: passedRate,
        source: getModuleSource(),
        expectTotal: Math.max(expectTotal || 0, total),
      };
    })
    .filter(res => res.caseCount > 0);

  console.log('Post data', postData);

  // if (ignorePostPassRate) {
  //   return;
  // }

  // return axios
  //   .post(postHost, {
  //     business: '',
  //     type: '',
  //     data: postData,
  //   })
  //   .then(
  //     _res => console.log('Post grafana dashboard passed rate: OK'),
  //     e => {
  //       console.log('Post grafana dashboard passed rate: FAILED', e);
  //       throw e;
  //     },
  //   );
};

const run = async () => {
  const resultJson = readResultJson();

  if (!resultJson) {
    return;
  }

  const moduleResults: ModuleResult[] = getModuleMatches().map(m => ({
    ...m,
    passed: 0,
    failed: 0,
    testResults: [],
  }));

  let extraShellText = 'export E2E_TEST_RESULT_POST_PASS_RATE=OK\n';

  try {
    await reportModulePassRate(resultJson, moduleResults);
  } catch (e) {
    extraShellText = 'export E2E_TEST_RESULT_POST_PASS_RATE=FAIL\n';
  }

  summaryPassRateShell(resultJson, extraShellText);
};

run();
