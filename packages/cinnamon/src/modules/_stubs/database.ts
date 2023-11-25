import { CinnamonOptionalCoreModuleStub } from '../../sdk/cinnamon-module';
import { MissingPackageError } from '../../sdk/base';
import Cinnamon from '../../core';

export class DatabaseModuleStub extends CinnamonOptionalCoreModuleStub {

    private static readonly MODULE_LABEL = 'Cinnamon Database Connector';
    private static readonly DEFAULT_DATABASE_MODULE = '@apollosoftwarexyz/cinnamon-database';

    get __stubIdentifier() {
        return 'DatabaseModule';
    }

    get __stubForModule() {
        return DatabaseModuleStub.DEFAULT_DATABASE_MODULE;
    }

    constructor(framework: Cinnamon, _models: any, _databaseConfig: any) {
        super(framework);
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public get isInitialized() : boolean {
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public get ormConfig() {
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public get entityManager() : any {
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public initialize() : Promise<void> {
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public connect(_passive?: boolean) : Promise<void> {
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public terminate(_force?: boolean) : Promise<void> {
        throw new MissingPackageError(DatabaseModuleStub.MODULE_LABEL, DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

}
