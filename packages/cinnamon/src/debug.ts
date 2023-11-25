/**
 * Cinnamon Web Framework | Debugging Module
 *
 * Copyright (c) Apollo Software Limited 2023 - MIT License
 * See /LICENSE.md for license information.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

import { parse as parseToml } from 'toml';

import Cinnamon from './core';
import { fileExists } from '@apollosoftwarexyz/cinnamon-internals';

class CinnamonDebug {
    private instances: Cinnamon[] = [];

    public getInstances() {
        return [...this.instances];
    }

    public get defaultInstance(): Cinnamon|undefined {
        return this.instances[0];
    }

    public get hasInstance() {
        return this.instances.length > 0;
    }

    public register(instance: Cinnamon) {
        if (!this.instances.includes(instance)) {
            this.instances.push(instance);
        }
    }

    public unregister(instance: Cinnamon) {
        if (this.instances.includes(instance)) {
            this.instances.splice(this.instances.indexOf(instance), 1);
        }
    }
}

(async () => {
    const workingDirectory = process.cwd();

    const cinnamonDebug = new CinnamonDebug();
    Object.defineProperty(global, 'cinnamonDebug', {
        get() { return cinnamonDebug; }
    });

    global.Cinnamon = Cinnamon;
    Object.defineProperty(global, 'framework', {
        get() {
            return global.cinnamonDebug.defaultInstance;
        },
    });

    try {
        if (!await fileExists(`${workingDirectory}/package.json`)) {
            console.error('Failed to find package.json in working directory');
            process.exit(1);
        }

        // Load the package.json file.
        const packageJson = await import(`${workingDirectory}/package.json`);
        const packageJsonName = packageJson.name;
        const dependencies = Object.keys(packageJson.dependencies ?? {});

        // Check if we have the Cinnamon package.
        if (!dependencies.includes('@apollosoftwarexyz/cinnamon')) {
            console.error('Failed to find Cinnamon in dependencies');
            process.exit(1);
        }

        // Load the project config file.
        const projectConfigFileContents = (await promisify(fs.readFile)('./cinnamon.toml', 'utf-8'));
        const projectConfigFile = parseToml(projectConfigFileContents);
        const projectConfigFileName = projectConfigFile.framework?.app?.name;
        const projectName = projectConfigFileName ?? packageJsonName;

        // Find the main file.
        const mainFile = path.resolve(packageJson.main ?? 'src/main.ts');

        console.log('');
        console.log('=== [ Cinnamon Debugging Module ] ===');
        console.log(`Found project: ${projectName}`);
        console.log('Booting Cinnamon Framework...');
        console.log('');

        import(mainFile);
    } catch (e) {
        console.log('=== [ Cinnamon Debugging Module | ERROR ] ===');
        console.error(e);
        process.exit(1);
    }
})();
