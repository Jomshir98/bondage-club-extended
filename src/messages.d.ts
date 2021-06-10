type BCX_beep_versionCheck = {
	version: string;
	UA: string;
};

type BCX_beep_versionResponse = {
	status: "unsupported" | "deprecated" | "newAvailable" | "current";
};

type BCX_beeps = {
	versionCheck: BCX_beep_versionCheck;
	versionResponse: BCX_beep_versionResponse;
};
