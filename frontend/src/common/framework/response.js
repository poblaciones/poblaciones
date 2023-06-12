export default class response {

	static OK = "OK";
	static ERROR = "ERROR";

	static IsOK(status) {
		return status === this.OK;
	}

	static IsError(status) {
		return status !== this.OK;
	}
}

