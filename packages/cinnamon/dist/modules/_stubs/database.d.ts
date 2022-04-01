import { CinnamonOptionalCoreModuleStub } from "../../sdk/cinnamon-module";
import Cinnamon from "../../core";
export declare abstract class DatabaseModuleStub extends CinnamonOptionalCoreModuleStub {
    private static readonly DEFAULT_DATABASE_MODULE;
    get __stubIdentifier(): string;
    get __stubForModule(): string;
    protected constructor(framework: Cinnamon);
    get isInitialized(): boolean;
    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    get ormConfig(): void;
    get entityManager(): any;
    get em(): any;
    abstract initialize(databaseConfig: any): Promise<void>;
    abstract connect(): Promise<void>;
    abstract terminate(force?: boolean): Promise<void>;
}
