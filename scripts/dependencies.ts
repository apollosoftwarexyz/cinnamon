// Sorry in advance for how hideous and gross (read: inelegant) this is!!!
// This was a 30min + Copilot script to generate some initial dependency graphs
// for Cinnamon.

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import * as legacyFs from 'node:fs';
import * as fs from 'node:fs/promises';

type DependencyEntry = {
    value: string;
    children: {
        Version: string;
        Dependencies?: [{
            descriptor: string;
            locator: string;
        }]
    }
};

function populateGraph(graph: Map<string, Set<string>>, dependencies: Set<string>, rawDependencies: DependencyEntry[], devDependencyNames: Set<string>) {
    dependencies.forEach((dependency) => {
        for (const devDependencyName of devDependencyNames) {
            if (dependency.startsWith(`${devDependencyName}@`)) return;
        }

        if (dependency.includes('@virtual')) {
            const name = dependency.split('@virtual')[0];
            let version = dependency.split('#npm:')[1];
            if (version.startsWith('^')) version = version.slice(1);
            const majorVersion = version.split('.')[0];

            const candidates = rawDependencies.filter((entry) => entry.value.startsWith(name) && entry.value.includes(`@npm:${majorVersion}.`));
            if (candidates.length === 0) throw new Error(`Could not find virtual dependency ${dependency}`);
            if (candidates.length > 1) throw new Error(`Found multiple virtual dependencies ${dependency}`);
            dependency = candidates[0].value;
        }

        if (graph.has(dependency)) return;

        const entry = rawDependencies.find((entry) => entry.value === dependency);
        if (!entry) throw new Error(`Could not find entry for ${dependency}`);

        const children = entry.children.Dependencies
            ?.map((child) => child.locator)
            ?.filter((child) => {
                for (const devDependencyName of devDependencyNames) {
                    if (child.startsWith(`${devDependencyName}@`)) return false;
                }
                return true;
            });
        if (!children) return;

        graph.set(dependency, new Set(children));
        populateGraph(graph, new Set(children), rawDependencies, devDependencyNames);
    });
}

async function resolvePackageJson(packageName: string) {
    const packageJsonPath = packageName === '@apollosoftwarexyz/cinnamon-workspaces'
        ? 'package.json'
        :`./packages/${packageName.split('/')[1]}/package.json`;

    if (!await promisify(legacyFs.exists)(packageJsonPath)) throw new Error(`Could not find package.json for ${packageName}`);
    return JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
}

function populateTransitive(graph: Map<string, Set<string>>) {
    graph.forEach((dependencies, dependency) => {
        let visited = new Set<string>([...dependencies]);

        dependencies.forEach((dependency) => {
            const children = graph.get(dependency);
            if (!children) return;
            children.forEach((child) => visited.add(child));
        });

        graph.set(dependency, visited);
    });
}

function lookup(graph: Map<string, Set<string>>, dependency: string) {
    for (const key of graph.keys()) {
        if (key.startsWith(`${dependency}@`)) return graph.get(key);
    }

    throw new Error(`Could not find ${dependency} in graph`);
}

(async () => {

    const rawDependencies: DependencyEntry[] = (await promisify(exec)('yarn info -AR --json')).stdout
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as DependencyEntry);

    // Build a set of all dependencies
    const all: Set<string> = new Set();
    rawDependencies.forEach((dependency) => all.add(dependency.value));

    // Direct dependencies - where the locator starts with @apollosoftwarexyz/cinnamon
    // (implies it's Cinnamon, or a Cinnamon package) and includes @workspace
    // (implies it's a workspace package)
    const direct = new Set(
        [...all.values()].filter((locator) =>
            locator.startsWith('@apollosoftwarexyz/cinnamon') && locator.includes('@workspace'))
    );

    const directNames = [...direct.values()].map((locator) => locator.split('@workspace')[0]);

    const directPackageJsons: Map<string, any> = new Map<string, any>();
    for (const name of directNames) {
        const packageJson = await resolvePackageJson(name);
        directPackageJsons.set(name, packageJson);
    }

    const devDependencyNames = new Set<string>();
    for (const packageJson of directPackageJsons.values()) {
        const devDependencies = packageJson['devDependencies'];
        if (!devDependencies) continue;
        Object.keys(devDependencies).forEach((dependency) => devDependencyNames.add(dependency));
    }

    // Build a transitive dependency graph for each direct dependency
    const graph: Map<string, Set<string>> = new Map();
    populateGraph(graph, direct, rawDependencies, devDependencyNames);
    populateTransitive(graph);

    console.dir(graph);
    // console.log(lookup(graph, 'chokidar'));

})();
