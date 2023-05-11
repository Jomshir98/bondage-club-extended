import { BCInteractionManager } from "./bcInteractions";
import { AccountNameGenerator, AccountPasswordGenerator, BCCharacterRegistrationData, LoginScreenRegister, MainHallLogout } from "./flows";
import { TestOpenBC } from "./helpers";
import { AssertNotNullable } from "./utils";

const account: BCCharacterRegistrationData = {
	characterName: "Testy",
	accountName: AccountNameGenerator(),
	password: AccountPasswordGenerator(),
};

describe("BC Registration and login", () => {
	test("New account registration", async () => {
		const bc = await TestOpenBC();

		await LoginScreenRegister(bc, account);
		await MainHallLogout(bc);
	});

	describe("Login", () => {
		let bc: BCInteractionManager;

		beforeAll(async () => {
			bc = await TestOpenBC({
				keepOpen: true,
			});
		});

		afterAll(async () => {
			await MainHallLogout(bc);
			await bc.close();
		});

		test("No login with wrong password", async () => {
			await bc.waitForScreen("Character", "Login");

			await bc.page.type("#InputName", account.accountName);
			await bc.page.type("#InputPassword", account.password.slice(1));

			await bc.clickButton({
				Label: "Login",
			});

			await bc.waitForText({
				Text: "Invalid name or password",
			});
		});

		test("Login with valid password", async () => {
			await bc.waitForScreen("Character", "Login");

			const nameInput = await bc.page.$("#InputName");
			AssertNotNullable(nameInput);
			await nameInput.click({ clickCount: 3 });
			await nameInput.type(account.accountName);

			const passwordInput = await bc.page.$("#InputPassword");
			AssertNotNullable(passwordInput);
			await passwordInput.click({ clickCount: 3 });
			await passwordInput.type(account.password);

			await bc.clickButton({
				Label: "Login",
			});

			await bc.waitForScreen("Room", "MainHall");
		});
	});
});
