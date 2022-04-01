"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModuleStub = void 0;
const cinnamon_module_1 = require("../../sdk/cinnamon-module");
const base_1 = require("../../sdk/base");
class DatabaseModuleStub extends cinnamon_module_1.CinnamonOptionalCoreModuleStub {
    constructor(framework) {
        super(framework);
    }
    get __stubIdentifier() {
        return "DatabaseModule";
    }
    get __stubForModule() {
        return DatabaseModuleStub.DEFAULT_DATABASE_MODULE;
    }
    get isInitialized() {
        throw new base_1.MissingModuleError(DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }
    /**
     * Returns the ORM configuration as it would be passed to Mikro-ORM in the
     * database module.
     */
    get ormConfig() {
        throw new base_1.MissingModuleError(DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }
    get entityManager() {
        throw new base_1.MissingModuleError(DatabaseModuleStub.DEFAULT_DATABASE_MODULE);
    }
    get em() {
        return this.entityManager;
    }
}
exports.DatabaseModuleStub = DatabaseModuleStub;
DatabaseModuleStub.DEFAULT_DATABASE_MODULE = "@apollosoftwarexyz/cinnamon-database";
