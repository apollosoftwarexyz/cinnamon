/**
 * @module @apollosoftwarexyz/cinnamon-internals
 * @internal
 * @private
 */
/**
 * Part of {@link cinnamonInternals}.
 *
 * @internal
 * @private
 */
export declare namespace fs {
    /**
     * Checks whether a file exists at the specified path, by 'stat'-ing the filePath to check if a FileSystem node exists
     * at that path and if, indeed, it is a file.
     *
     * Returns true if the file exists, or false otherwise.
     *
     * @param filePath The file path to check.
     */
    function fileExists(filePath: string): Promise<boolean>;
    /**
     * Similar to {@link fileExists} but instead checks if the specified path is a directory, after checking
     * whether the FileSystem node exists.
     *
     * Returns true if the directory exists, or false otherwise.
     *
     * @param directoryPath The directory path to check.
     */
    function directoryExists(directoryPath: string | undefined): Promise<boolean>;
    /**
     * Locates the specified path, relative to the current working directory, then resolves the
     * absolute path to that file.
     *
     * @param childPath The child of the current working directory to locate prior to determining the
     *                  absolute path.
     */
    function toAbsolutePath(childPath: string): string;
    /**
     * Resolves the relative path, path, with respect to the rootPath.
     * Also protects against malicious paths designed to access files outside the
     * rootPath.
     *
     * @param rootPath The root path to resolve relative to.
     * @param relativePath The relative path to resolve.
     */
    function resolveAbsolutePath(rootPath: string, relativePath: string): string;
    /**
     * Recursively lists the paths of files in a directory and its children.
     * A string list of the absolute paths of all the child files is returned.
     *
     * @param directoryPath The path of the root directory to search.
     */
    function listRecursively(directoryPath: string): Promise<string[]>;
    /**
     * Returns the date the path was previously modified.
     *
     * @param path The path to get the modification date of.
     */
    function getLastModification(path: string): Promise<Date>;
}
