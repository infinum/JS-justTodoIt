import { Catch, ExceptionFilterMethods, PlatformContext } from '@tsed/common';
import { Exception } from '@tsed/exceptions';
import { ResponseErrorCode } from '../enums/response-error-code.enum';

export interface IErrorResponseBody {
	code: string;
	message: string;
	requestId: string;
	details?: unknown;
}

interface IMappedError {
	status: number;
	body: Omit<IErrorResponseBody, 'requestId'>;
}

const uniqueConstraintRegEx = /UNIQUE constraint failed: (.*)/i;
const relationErrorRegEx = /(Relation.*was not found)|(".*" alias was not found)/i;
const propertyNotFoundRegEx = /(Property ".*" was not found)|(column was not found in the .* entity)/i;
// Messages of our own throws are already codes, e.g. `token_missing`
const errorCodeRegEx = /^[a-z][a-z0-9_]*$/;

// Unique columns → the conflict code a client can act on
const conflictCodes: Array<[RegExp, ResponseErrorCode]> = [
	[/\buser\.email\b/, ResponseErrorCode.USER_EXISTS],
	[/\btodo_list\.title\b/, ResponseErrorCode.TODO_LIST_TITLE_EXISTS],
];

const defaultCodes: Record<number, ResponseErrorCode> = {
	400: ResponseErrorCode.BAD_REQUEST,
	401: ResponseErrorCode.UNAUTHORIZED,
	403: ResponseErrorCode.FORBIDDEN,
	404: ResponseErrorCode.NOT_FOUND,
	409: ResponseErrorCode.RESOURCE_CONFLICT,
};

function validationDetails(error: Exception & { errors?: unknown; origin?: { errors?: unknown } }): unknown {
	const details = error.errors ?? error.origin?.errors;

	return Array.isArray(details) && details.length ? details : undefined;
}

function mapError(error: Error): IMappedError {
	const message = error?.message ?? '';

	const uniqueConstraint = uniqueConstraintRegEx.exec(message);
	if (uniqueConstraint) {
		const code =
			conflictCodes.find(([columns]) => columns.test(uniqueConstraint[1]))?.[1] ?? ResponseErrorCode.RESOURCE_CONFLICT;

		return { status: 409, body: { code, message: 'Resource already exists' } };
	}

	if (relationErrorRegEx.test(message)) {
		return {
			status: 400,
			body: { code: ResponseErrorCode.INVALID_RELATION, message: 'Unknown relation requested' },
		};
	}

	if (propertyNotFoundRegEx.test(message)) {
		return {
			status: 400,
			body: { code: ResponseErrorCode.VALIDATION_ERROR, message: 'Unknown property requested' },
		};
	}

	if (!(error instanceof Exception) || error.status >= 500) {
		return {
			status: 500,
			body: { code: ResponseErrorCode.INTERNAL_SERVER_ERROR, message: 'Internal server error' },
		};
	}

	const details = validationDetails(error);
	if (details) {
		return {
			status: error.status,
			body: { code: ResponseErrorCode.VALIDATION_ERROR, message, details },
		};
	}

	const code = errorCodeRegEx.test(message) ? message : (defaultCodes[error.status] ?? ResponseErrorCode.BAD_REQUEST);

	return { status: error.status, body: { code, message } };
}

/**
 * Every error response is `{ code, message, requestId, details? }` and never carries SQL or schema names.
 */
@Catch(Error, Exception)
export class ErrorFilter implements ExceptionFilterMethods {
	catch(error: Error, ctx: PlatformContext): void {
		const { status, body } = mapError(error);

		if (status >= 500) {
			ctx.logger.error({
				event: 'unhandled_error',
				error_name: error?.name,
				error_message: error?.message,
				stack: error?.stack,
			});
		}

		const responseBody: IErrorResponseBody = { ...body, requestId: ctx.id };
		ctx.response.status(status).body(responseBody);
	}
}
