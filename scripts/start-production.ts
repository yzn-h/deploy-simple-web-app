const shutdownSignals: Array<Signals> = ['SIGINT', 'SIGTERM']

let activeProcess: Bun.Subprocess | null = null

for (const signal of shutdownSignals) {
    process.on(signal, () => {
        activeProcess?.kill(signal)
    })
}

const run = async (cmd: Array<string>) => {
    const processHandle = Bun.spawn({
        cmd,
        cwd: process.cwd(),
        env: process.env,
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
    })
    activeProcess = processHandle

    const exitCode = await processHandle.exited
    activeProcess = null

    if (exitCode !== 0) {
        process.exit(exitCode)
    }
}

await run(['bun', '--bun', 'drizzle-kit', 'push'])
await run(['bun', 'run', '.output/server/index.mjs'])

export { }
