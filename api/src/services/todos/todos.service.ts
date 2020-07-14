import { Service } from '@tsed/di';
import { Todo } from '../../entities/todo';
import { User } from '../../entities/user';
import { DeleteResult, Like, FindConditions } from 'typeorm';
import { TodoSortBy } from '../../enums/todo-sort-by.enum';
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
  sortBy?: TodoSortBy;
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
  private readonly repositry = Todo.getRepository();

  public async fetchAll({
    relations,
    user,
    page,
    sortBy,
    sortDirection,
    title,
  }: ITodoFetchingOptions): Promise<IPagedResult<Todo>> {
    // Pagination
    page = {
      size: page?.size ?? DEFAULT_PAGE_SIZE,
      number: page?.number ?? DEFAULT_PAGE,
    };
    const skip = Math.max((page.number - 1) * page.size, 0);
    const take = page?.size ?? DEFAULT_PAGE_SIZE;

    // Sorting
    const order = {
      [sortBy ?? TodoSortBy.CREATED]: sortDirection ?? SortDirection.DESC,
    };

    const where: FindConditions<Todo> = {
      user,
    }

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
      where
    })

    return {
      count,
      results,
    }
  }

  public fetchOne({
    uuid,
    relations,
    user,
  }: ITodoFetchOneOptions): Promise<Todo> {
    return this.repositry.findOne({
      where: {
        uuid,
        user,
      },
      relations,
    });
  }

  public delete({
    uuid,
    user
  }: IDeleteTodoOptions): Promise<DeleteResult> {
    return this.repositry.delete({
      uuid,
      user,
    });
  }

  public save(todo: Todo): Promise<Todo> {
    return this.repositry.save(todo);
  }
}
