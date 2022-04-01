import { CinnamonOptionalCoreModuleStub } from "../../sdk/cinnamon-module";
import { MissingModuleError } from "../../sdk/base";
import Cinnamon from "../../core";

export abstract class DatabaseModuleStub extends CinnamonOptionalCoreModuleStub {

    private static readonly DEFAULT_DATABASE_MODULE = "@apollosoftwarexyz/cinnamon-database";

    get __stubIdentifier() {
        return "DatabaseModule";
    }

    get __stubForModule() {
        return DatabaseModuleStub.DEFAULT_DATABASE_MODULE;
    }

    protected constructor(framework: Cinnamon) {
        super(framework);
    }

    public get isInitialized() : boolean {
        throw new MissingModuleError(DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    public get ormConfig() {
        throw new MissingModuleError(DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public get entityManager() : any {
        throw new MissingModuleError(DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }

    public get em() {
        return this.entityManager;
    }

    public abstract initialize(databaseConfig: any) : Promise<void>;

    public abstract connect() : Promise<void>;
    public abstract terminate(force?: boolean) : Promise<void>;

}
