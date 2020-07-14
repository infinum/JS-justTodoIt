import { Controller, Req, Get, Post, BodyParams, QueryParams, PathParams, Res, Required, PropertyType, Delete, Patch, Property } from '@tsed/common';
import { Todo } from '../../entities/todo';
import { Summary, ReturnsArray, Returns, BaseParameter } from '@tsed/swagger';
import { TodosService } from '../../services/todos/todos.service';
import { Auth } from '../../decorators/auth.decorator';
import { TodoItem } from '../../entities/todo-item';
import { NotFound } from '@tsed/exceptions';
import { SortDirection } from '../../enums/sort-direction.enum';
import { TodoSortBy } from '../../enums/todo-sort-by.enum';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from '../../constants';

class CreateTodoItemData {
  @Required()
  title: string;
}

class CreateTodoData {
  @Required()
  title: string;

  @PropertyType(CreateTodoItemData)
  items: Array<CreateTodoItemData>;
}

class PatchTodoData {
  @Property()
  title: string;

  @PropertyType(TodoItem)
  items: Array<TodoItem>;
}

@Controller('/todos')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
  ) {}

  @Get('/')
  @Summary('Get all of the user\'s Todos')
  @Auth({
    passUser: true,
  })
  @ReturnsArray(Todo)
  async fetchAll(
    @QueryParams('relations', String) relations: Array<string>,
    @QueryParams('pageNumber') @BaseParameter({ default: DEFAULT_PAGE }) pageNumber: number,
    @QueryParams('pageSize') @BaseParameter({ default: DEFAULT_PAGE_SIZE }) pageSize: number,
    @QueryParams('sortBy') @BaseParameter({ default: TodoSortBy.CREATED, enum: TodoSortBy }) sortBy: TodoSortBy,
    @QueryParams('sortDirection') @BaseParameter({ default: SortDirection.DESC, enum: SortDirection  }) sortDirection: SortDirection,
    @QueryParams('title') title: string,
    @Req() req: Req,
    @Res() res: Res,
  ): Promise<Array<Todo>> {
    const pagedResult = await this.todosService.fetchAll({
      user: req.user,
      relations,
      page: {
        number: pageNumber,
        size: pageSize,
      },
      sortBy,
      sortDirection,
      title,
    });

    res.setHeader('X-TOTAL-COUNT', pagedResult.count);

    return pagedResult.results;
  }

  @Get('/:uuid')
  @Summary('Get Todo by uuid')
  @Auth({
    passUser: true,
  })
  @Returns(Todo)
  @Returns(404, { description: 'Not found', type: NotFound })
  async fetchById(
    @PathParams('uuid') uuid: string,
    @QueryParams('relations', String) relations: Array<string>,
    @Req() req: Req,
    @Res() res: Res,
  ): Promise<Todo | NotFound> {
    const todo = await this.todosService.fetchOne({
      user: req.user,
      relations,
      uuid,
    });
    if (!todo) {
      res.status(404);
      return new NotFound(`Todo with uuid "${uuid}" not found`);
    }

    return todo;
  }

  @Delete('/:uuid')
  @Summary('Delete Todo by uuid')
  @Auth({
    passUser: true,
  })
  async delete(
    @PathParams('uuid') uuid: string,
    @Req() req: Req,
    @Res() res: Res,
  ): Promise<void> {
    await this.todosService.delete({
      uuid,
      user: req.user,
    });

    res.sendStatus(204);
  }

  @Patch('/:uuid')
  @Summary('Partial or full opdate of a Todo by uuid')
  @Auth({
    passUser: true,
  })
  async update(
    @PathParams('uuid') uuid: string,
    @BodyParams() todoData: PatchTodoData,
    @Req() req: Req,
  ): Promise<Todo> {
    const todo = await this.todosService.fetchOne({
      uuid,
      user: req.user,
      relations: ['items'],
    });

    if ('title' in todoData) {
      todo.title = todoData.title;
    }

    if ('items' in todoData) {
      const oldItems = todo.items;
      todo.items = todoData.items;
      const newUuids = todo.items.map(({ uuid }) => uuid).filter(Boolean);

      for (const oldItem of oldItems) {
        if (!newUuids.includes(oldItem.uuid)) {
          await oldItem.remove();
        }
      }
    }

    return this.todosService.save(todo);
  }

  @Post('/')
  @Summary('Create new Todo')
  @Auth({
    passUser: true,
  })
  @Returns(Todo)
  async create(
    @BodyParams() todoData: CreateTodoData,
    @Req() req: Req,
  ): Promise<Todo> {
    const todo = new Todo();
    todo.title = todoData.title;
    todo.created = new Date();
    todo.user = req.user;

    const todoItems = (todoData.items ?? []).map((todoItemData) => {
      const todoItem = new TodoItem();
      todoItem.title = todoItemData.title;
      todoItem.done = false;

      return todoItem;
    });
    todo.items = todoItems;

    return this.todosService.save(todo);
  }
}
