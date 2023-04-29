import { customAlphabet } from "nanoid";
import { wait } from "./utils";
import { BCInteractionManager } from "./bcInteractions";

export type BCCharacterRegistrationData = {
	/** `/^[a-zA-Z ]{1,20}$/` */
	characterName: string;
	/** `/^[a-zA-Z0-9]{1,20}$/` */
	accountName: string;
	/** `/^[a-zA-Z0-9]{1,20}$/` */
	password: string;
	email?: string;
};

export const AccountNameGenerator = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
export const AccountPasswordGenerator = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export async function LoginScreenRegister(bc: BCInteractionManager, account: BCCharacterRegistrationData): Promise<void> {
	const page = bc.page;
	await bc.waitForScreen("Character", "Login");

	// Login screen
	await bc.clickButton({
		Label: "New Character",
	});
	await bc.waitForScreen("Character", "Disclaimer");

	// Confirmation screen
	await bc.clickButton({
		Label: "I accept",
	});
	await bc.waitForScreen("Character", "Appearance");

	// Character setup
	await bc.clickButton({
		HoveringText: "Randomize character",
	});
	await bc.clickButton({
		HoveringText: "Accept changes",
	});
	await bc.waitForScreen("Character", "Creation");

	// Enter character data
	await page.type("#InputCharacter", account.characterName);
	await page.type("#InputName", account.accountName);
	await page.type("#InputPassword1", account.password);
	await page.type("#InputPassword2", account.password);
	if (account.email) {
		await page.type("#InputEmail", account.email);
	}
	await wait(100);

	// Register
	await bc.clickButton({
		Label: "Create your account",
	});
	await bc.waitForScreen("Room", "MainHall");

	// Get through initial quiz
	await bc.clickDialogLine({
		Option: "No, I've been here before.",
	});
	await bc.clickDialogLine({
		Option: "Yes.  I will be honest.",
	});
	await bc.clickDialogLine({
		Option: "I'm an adult.",
	});
	await bc.clickDialogLine({
		Option: "I'm fine with BDSM.",
	});
	await bc.clickDialogLine({
		Option: "I will be respectful and open-minded.",
	});
	await bc.clickDialogLine({
		Option: "Everything will be consensual, and I will respect limits.",
	});
	await bc.clickDialogLine({
		Option: "I will stay safe when I play.",
	});
	await bc.clickDialogLine({
		Option: "My personal information will stay personal.",
	});
	await bc.clickDialogLine({
		Option: "I won't use exploits against others.",
	});
	await bc.clickDialogLine({
		Option: "(Thank her and leave her.)",
	});
}

export async function MainHallLogout(bc: BCInteractionManager): Promise<void> {
	const page = bc.page;

	await bc.waitForScreen("Room", "MainHall");

	page.once("dialog", (dialog) => {
		expect(dialog.message()).toBe("Do you want to leave the club?");
		void dialog.accept();
	});

	await Promise.all([
		page.waitForNavigation({
			waitUntil: "domcontentloaded",
		}),
		bc.clickButton({
			HoveringText: "Leave the Club",
		}),
	]);
}
