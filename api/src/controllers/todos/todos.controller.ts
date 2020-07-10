import { Controller, Req, Get, Post, BodyParams, QueryParams, PathParams, Res, Required, PropertyType } from '@tsed/common';
import { Todo } from '../../entities/todo';
import { Summary, ReturnsArray, Returns } from '@tsed/swagger';
import { TodosService } from '../../services/todos/todos.service';
import { Auth } from '../../decorators/auth.decorator';
import { TodoItem } from '../../entities/todo-item';
import { NotFound } from '@tsed/exceptions';

class CreateTodoItemData {
  @Required()
  title: string;
}

class CreateTodoData {
  @Required()
  @PropertyType(CreateTodoItemData)
  items: Array<CreateTodoItemData>;
}

@Controller('/todos')
@Summary('Get all of the user\'s todos')
export class AuthController {
  constructor(
    private readonly todosService: TodosService,
  ) {}

  @Get('/')
  @Auth({
    passUser: true,
  })
  @ReturnsArray(Todo)
  async fetchAll(
    @QueryParams('relations', String) relations: Array<string>,
    @Req() req: Req,
  ): Promise<Array<Todo>> {
    return this.todosService.fetchAll({
      user: req.user,
      relations,
    });
  }

  @Get('/:uuid')
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

  @Post('/')
  @Auth({
    passUser: true,
  })
  @Returns(Todo)
  async create(
    @BodyParams() todoData: CreateTodoData,
    @Req() req: Req,
  ): Promise<Todo> {
    const todo = new Todo();
    todo.created = new Date();
    todo.user = req.user;

    console.log(todoData.items);

    const todoItems = todoData.items.map((todoItemData) => {
      const todoItem = new TodoItem();
      todoItem.title = todoItemData.title;
      todoItem.done = false;

      return todoItem;
    })

    todo.items = todoItems;

    console.log(todo.items);

    return this.todosService.save(todo);
  }
}
