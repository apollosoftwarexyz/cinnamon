export default function printHelp(reason?: string) {
    if (reason) {
        console.error(reason);
        console.log();
    }

    console.log("Usage: cinnamon <command> [options]");
    console.log();
    console.log("   cinnamon dbConfig\t- Generates a database configuration file for Mikro-ORM.");

    return 0;
}
