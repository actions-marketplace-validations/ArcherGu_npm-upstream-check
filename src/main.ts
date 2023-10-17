import core from '@actions/core'
import { run as ncu } from 'npm-check-updates'

export async function run(cwd?: string) {
  try {
    const upstreamDeps = core.getInput('upstream', { required: true }).trim().split(',')
    const deep = core.getInput('deep', { required: false }) === 'true'
    const checkOnly = core.getInput('check-only', { required: false }) === 'true'
    const allDeps = core.getInput('all', { required: false }) === 'true'

    core.debug(`upstream npm dependencies: ${upstreamDeps.join(', ')}`)

    const updateInfos: { [key: string]: string } = {}
    const result = await ncu({
      deep,
      cwd,
      filterResults: (packageName) => {
        if (allDeps) {
          return true
        }

        return upstreamDeps.includes(packageName)
      },
      upgrade: !checkOnly,
    })

    // 如果 result 为
    if (!result) {
      core.setOutput('need-update', false)
      return
    }

    for (const key in result) {
      if (deep) {
        for (const pkgName in (result as any)[key]) {
          if (allDeps || upstreamDeps.includes(pkgName)) {
            updateInfos[pkgName] = (result as any)[key][pkgName]
          }
        }
      } else {
        if (allDeps || upstreamDeps.includes(key)) {
          updateInfos[key] = (result as any)[key]
        }
      }
    }

    const needUpdate = Object.keys(updateInfos).length > 0
    core.setOutput('need-update', needUpdate)
    needUpdate && core.setOutput('dependencies', updateInfos)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}