export enum ResponseErrorCode {
	INCORRECT_EMAIL_OR_PASSWORD = 'incorrect_email_or_password',
	USER_NOT_ACTIVATED = 'user_not_activated',
	USER_ALREADY_ACTIVATED = 'user_already_activated',
	USER_EXISTS = 'user_with_same_email_exists',
	USER_DOES_NOT_EXISTS = 'user_does_not_exists',
	ACTIVATION_TOKEN_EXPIRED_OR_INVALID = 'activation_token_expired_or_invalid',
	PASSWORD_RESET_TOKEN_EXPIRED_OR_INVALID = 'password_reset_token_expired_or_invalid',
	TOKEN_MISSING = 'token_missing',
	TOKEN_INVALID = 'token_invalid',
	ENTITY_ACCESS_FORBIDDEN = 'entity_access_forbidden',
	ERROR_SENDING_EMAIL = 'error_sending_email',
	PASSWORD_RESET_REQUEST_ERROR = 'password_reset_request_error',
}
