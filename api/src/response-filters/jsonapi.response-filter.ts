import {ResponseFilter, Context, ResponseFilterMethods} from "@tsed/common";

@ResponseFilter("application/vnd.api+json")
export class JsonapiResponseFilter implements ResponseFilterMethods {
  transform(data: any, ctx: Context) {
    console.log('---------------------------------------JsonapiResponseFilter', ctx.url);


    return data;
  }
}
