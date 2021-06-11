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

type BCX_message_ChatRoomStatusEvent = {
	Type: string;
	Target: number | null;
};

type BCX_message_hello = {
	version: string;
	request: boolean;
};

type BCX_message_ = {

};

type BCX_messages = {
	ChatRoomStatusEvent: BCX_message_ChatRoomStatusEvent;
	hello: BCX_message_hello;
	goodbye: undefined;
};
