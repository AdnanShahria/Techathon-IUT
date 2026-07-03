import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import figlet from 'figlet';
import readline from 'readline';

const log = console.log;

// Display the beautiful banner
const displayBanner = () => {
    return new Promise((resolve) => {
        figlet('Techathon IUT', (err, data) => {
            if (err) {
                log(chalk.red('Something went wrong with the banner'));
                resolve();
                return;
            }
            log(gradient.pastel.multiline(data));
            
            const boxenOptions = {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                backgroundColor: '#1E1E1E',
                title: 'Smart Office Monitor',
                titleAlignment: 'center',
            };
            
            const msg = chalk.white.bold('🚀 Starting Full Development Environment') + '\n' +
                        chalk.blue('Frontend:') + ' Vite React Server\n' +
                        chalk.green('Backend:') + ' Node.js API Server';
                        
            log(boxen(msg, boxenOptions));
            resolve();
        });
    });
};

const startProcess = (name, command, color, args) => {
    return new Promise((resolve, reject) => {
        const spinner = ora({
            text: `Starting ${name}...`,
            color: color
        }).start();

        const isWindows = process.platform === 'win32';
        const cmd = isWindows ? 'npm.cmd' : command;
        
        const proc = spawn(cmd, args, { 
            stdio: 'pipe',
            shell: isWindows 
        });

        let started = false;

        const rl = readline.createInterface({
            input: proc.stdout,
            output: process.stdout,
            terminal: false
        });

        const rlErr = readline.createInterface({
            input: proc.stderr,
            output: process.stdout,
            terminal: false
        });

        // Some chalk colors are not keywords in v5. So we can use hex or standard colors.
        // Let's rely on standard colors.
        const prefixFn = chalk[color] || chalk.white;
        const prefix = prefixFn.bold(`[${name.toUpperCase()}]`);

        rl.on('line', (line) => {
            if (!started) {
                spinner.succeed(prefixFn.bold(`${name} Started Successfully!🚀`));
                started = true;
                resolve(proc);
            }
            log(`${prefix} ${line}`);
        });

        rlErr.on('line', (line) => {
            // Only resolve if it's not a fatal error
            if (!started) {
                spinner.succeed(prefixFn.bold(`${name} Started (with stderr logs)`));
                started = true;
                resolve(proc);
            }
            log(`${prefix} ${chalk.red(line)}`);
        });
        
        proc.on('close', (code) => {
            if (!started) {
                spinner.fail(chalk.red(`${name} failed to start (code ${code})`));
                reject(new Error(`${name} exited with code ${code}`));
            } else {
                log(`${prefix} ${chalk.yellow(`Process exited with code ${code}`)}`);
            }
        });
    });
};

const main = async () => {
    console.clear();
    await displayBanner();
    
    try {
        log(chalk.gray('----------------------------------------'));
        const backendArgs = ['run', 'dev:backend'];
        const frontendArgs = ['run', 'dev:frontend'];
        
        // Let's delay slightly to make the animation visible
        await new Promise(r => setTimeout(r, 1000));
        await startProcess('Backend', 'npm', 'green', backendArgs);
        
        await new Promise(r => setTimeout(r, 1000));
        await startProcess('Frontend', 'npm', 'cyan', frontendArgs);
        
        log(chalk.gray('----------------------------------------'));
        log(chalk.green.bold('\n✨ All systems are up and running! ✨\n'));
        log(chalk.white('Press Ctrl+C to stop all processes.\n'));
    } catch (err) {
        log(chalk.red.bold('\n❌ Failed to start the development environment'));
        log(chalk.red(err.message));
        process.exit(1);
    }
};

main();

process.on('SIGINT', () => {
    log(chalk.yellow('\n\nGracefully shutting down...'));
    process.exit(0);
});
