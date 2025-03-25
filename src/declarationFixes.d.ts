// manual sha.js typings, because the existing typings import Node
declare module "sha.js" {
	abstract class Hash {
		update(data: import("safe-buffer").Buffer): Hash;
		update(data: string, inputEncoding: string): Hash;
		digest(): import("safe-buffer").Buffer;
		digest(encoding: string): string;
	}

	function SHA(algorithm: SHA.Algorithm | Uppercase<SHA.Algorithm>): Hash;

	namespace SHA {
		type Algorithm = "sha" | "sha1" | "sha224" | "sha256" | "sha384" | "sha512";
		type HashStatic = new() => Hash;

		const sha: HashStatic;
		const sha1: HashStatic;
		const sha224: HashStatic;
		const sha256: HashStatic;
		const sha384: HashStatic;
		const sha512: HashStatic;
	}

	export = SHA;
}

