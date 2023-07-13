export const getModuleSource = () => '测试';
export const getMiniReportTitle = () => 'E2E测试报告';

/**
 * 汇总模块定义
 *
 * teamTag: 归属小组。
 * name: 模块名称，需唯一，不能和别的小组冲突.
 * patterns: 测试用例文件的相对路径匹配模式, 必需定义. 参考 minimatch, 见 https://www.npmjs.com/package/minimatch 。
 * expectTotal: 当前模块预计的测试用例总数，包含待录入的个数。
 */
export const getModuleMatches = () => {
  return [
    {
      teamTag: '测试1组',
      name: 'PC测试用例',
      patterns: ['**/*'],
      expectTotal: 2,
    },
    {
      teamTag: '未知小组',
      name: '未知模块',
      patterns: null,
    },
  ]
}
