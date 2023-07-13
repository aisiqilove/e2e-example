/* eslint-disable no-console */
import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

class LogReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase, _result: TestResult) {
    const { file, line, column } = test.location || {};
    console.log(`Starting test "${test.title}" in "${file}:${line}:${column}"`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Finished test "${test.title}": ${result.status}`);
  }

  onEnd(result: FullResult) {
    console.log(`Finished the run: ${result.status}`);
  }

  printsToStdio() {
    return true;
  }
}

export default LogReporter;
