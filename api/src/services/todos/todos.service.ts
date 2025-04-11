import { Service } from '@tsed/di';
import { TodoList } from '../../entities/todo-list';
import { User } from '../../entities/user';
import { DeleteResult, Like, FindConditions } from 'typeorm';
import { TodoListSortBy } from '../../enums/todo-list-sort-by.enum';
import { SortDirection } from '../../enums/sort-direction.enum';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from '../../constants';
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
	private readonly repositry = TodoList.getRepository();

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

		// Sorting
		let order: Record<string, SortDirection>;
		if (sortBy) {
			order = {
				[sortBy]: sortDirection ?? SortDirection.ASC,
			};
		}

		const where: FindConditions<TodoList> = {
			user,
		};

		if (title) {
			where.title = Like(`%${title}%`);
		}

		const results = await this.repositry.find({
			where,
			skip,
			take,
			relations,
			order,
		});

		const count = await this.repositry.count({
			where,
		});

		return {
			count,
			results,
		};
	}

	public fetchOne({ uuid, relations, user }: ITodoFetchOneOptions): Promise<TodoList> {
		return this.repositry.findOne({
			where: {
				uuid,
				user,
			},
			relations,
		});
	}

	public delete({ uuid, user }: IDeleteTodoOptions): Promise<DeleteResult> {
		return this.repositry.delete({
			uuid,
			user,
		});
	}

	public save(todo: TodoList): Promise<TodoList> {
		return this.repositry.save(todo);
	}
}
