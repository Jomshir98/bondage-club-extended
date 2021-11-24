// @ts-check

const fs = require("fs");
const path = require("path");

/**
 * @param {string} dir 
 * @return {string[]}
 */
function makeFileList(dir) {
	/** @type {string[]} */
	const result = [];

	for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
		if (f.isFile()) {
			result.push(f.name);
		} else if (f.isDirectory()) {
			result.push(...makeFileList(path.join(dir, f.name)).map(i => f.name + "/" + i));
		}
	}

	return result
}

const list = makeFileList("../Bondage-College/BondageClub/Backgrounds")
	.filter(i => i.endsWith(".jpg"))
	.map(i => i.substr(0, i.length - ".jpg".length))
	.sort();

fs.writeFileSync("./src/generated/backgroundList.json",
	JSON.stringify(list, undefined, '\t'),
	{ encoding: "utf8" }
);

console.log(`Done! Found ${list.length} backgrounds.`);
