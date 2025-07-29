import { Service } from "@tsed/di";
import { DeleteResult, FindOptionsWhere, Like } from "typeorm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../../constants";
import { TodoList } from "../../entities/todo-list";
import { User } from "../../entities/user";
import { SortDirection } from "../../enums/sort-direction.enum";
import { TodoListSortBy } from "../../enums/todo-list-sort-by.enum";
import { IPagedResult } from "../../interfaces/paged-result.interface";

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

    // Sorting
    let order: Record<string, SortDirection>;
    if (sortBy) {
      order = {
        [sortBy]: sortDirection ?? SortDirection.ASC,
      };
    }

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

  public fetchOne({
    uuid,
    relations,
    user,
  }: ITodoFetchOneOptions): Promise<TodoList> {
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

  public save(todo: TodoList): Promise<TodoList> {
    return this.repository.save(todo);
  }
}
