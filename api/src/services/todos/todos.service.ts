import { Service } from '@tsed/di';
import { Todo } from '../../entities/todo';
import { User } from '../../entities/user';
import { DeleteResult } from 'typeorm';
import { TodoSortBy } from '../../enums/todo-sort-by.enum';
import { SortDirection } from '../../enums/sort-direction.enum';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from '../../constants';

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

  public fetchAll({
    relations,
    user,
    page,
    sortBy,
    sortDirection,
  }: ITodoFetchingOptions): Promise<Array<Todo>> {
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

    return this.repositry.find({
      where: {
        user,
      },
      skip,
      take,
      relations,
      order,
    });
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
