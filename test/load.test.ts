import { BCInteractionManager } from "./bcInteractions";
import { TestLoadBCX, TestOpenBC } from "./helpers";

describe("Load", () => {
	let bc: BCInteractionManager;

	it("Should load BC", async () => {
		bc = await TestOpenBC({
			keepOpen: true,
		});

		await expect(bc.page.title()).resolves.toMatch("Bondage Club");
	});

	it("Should load BCX", async () => {
		await TestLoadBCX(bc.page);
	});
});
