import readline from 'readline'
import fs from 'fs'

function isRunningInDocker(): boolean {
  try {
    const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8')
    return cgroup.includes('docker')
  } catch (err) {
    return false // If `/proc/1/cgroup` is not readable, assume not in Docker
  }
}

function askUser(promptText: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

;(async function main() {
  if (!isRunningInDocker()) {
    const answer = await askUser(
      'Tests are running outside Docker, you can lose all your local db data. Proceed? (y/n): ',
    )

    if (!['yes', 'y'].includes(answer.toLowerCase().trim())) {
      console.log('Aborting tests.')
      process.exit(1) // Exit with failure
    }
  }

  console.log('Proceeding with tests...')
})()
