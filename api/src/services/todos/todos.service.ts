import { Service } from '@tsed/di';
import { DeleteResult, FindOptionsWhere, Like } from 'typeorm';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../constants';
import { TodoList } from '../../entities/todo-list';
import { Todo } from '../../entities/todo';
import { User } from '../../entities/user';
import { SortDirection } from '../../enums/sort-direction.enum';
import { TodoListSortBy } from '../../enums/todo-list-sort-by.enum';
import { IPagedResult } from '../../interfaces/paged-result.interface';

interface IBaseTodoFetchingOptions {
	relations?: Array<string>;
	user?: User;
}

interface ITodoFetchingOptions extends IBaseTodoFetchingOptions {
	page?: {
		number: number;
		size: number;
	};
	sortBy?: TodoListSortBy;
	sortDirection?: SortDirection;
	title?: string;
}

interface ITodoFetchOneOptions extends IBaseTodoFetchingOptions {
	uuid: string;
}

interface IDeleteTodoOptions {
	uuid: string;
	user?: User;
}

@Service()
export class TodosService {
	private readonly repository = TodoList.getRepository();

	public async fetchAll({
		relations,
		user,
		page,
		sortBy,
		sortDirection,
		title,
	}: ITodoFetchingOptions): Promise<IPagedResult<TodoList>> {
		// Pagination
		page = {
			size: page?.size ?? DEFAULT_PAGE_SIZE,
			number: page?.number ?? DEFAULT_PAGE,
		};
		const skip = Math.max((page.number - 1) * page.size, 0);
		const take = page?.size ?? DEFAULT_PAGE_SIZE;

		// Sorting: `@Default` on query params only documents, so apply the documented defaults here
		const order: Record<string, SortDirection> = {
			[sortBy ?? TodoListSortBy.CREATED]: sortDirection ?? SortDirection.DESC,
		};

		const where: FindOptionsWhere<TodoList> = {
			user,
		};

		if (title) {
			where.title = Like(`%${title}%`);
		}

		const results = await this.repository.find({
			where,
			skip,
			take,
			relations,
			order,
		});

		const count = await this.repository.count({
			where,
		});

		return {
			count,
			results,
		};
	}

	public fetchOne({ uuid, relations, user }: ITodoFetchOneOptions): Promise<TodoList> {
		return this.repository.findOne({
			where: {
				uuid,
				user,
			},
			relations,
		});
	}

	public delete({ uuid, user }: IDeleteTodoOptions): Promise<DeleteResult> {
		return this.repository.delete({
			uuid,
			user,
		});
	}

	/**
	 * Saves the list and deletes `removedTodos` in one transaction,
	 * so a rejected save (e.g. a title conflict) changes nothing.
	 */
	public save(todoList: TodoList, removedTodos: Array<Todo> = []): Promise<TodoList> {
		return this.repository.manager.transaction(async (manager) => {
			if (removedTodos.length) {
				await manager.remove(removedTodos);
			}

			return manager.save(todoList);
		});
	}
}
