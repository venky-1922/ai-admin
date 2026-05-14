import {agent} from "@/app/lib/agent"
import { NextRequest,NextResponse } from "next/server"

export async function POST(req:NextRequest){
    try{
        const body = await req.json();
        const query = body.question;
        const my_agent = await agent();
        const response = await my_agent.invoke({messages:[{role:"user",content:query}]})
        return NextResponse.json(
            {result : response.messages.length>0 ? response.messages[response.messages.length-1].content:"the operation is not completed"},
            {status:200}
        )
    }
    catch (error) {
    console.error("Error occurred while processing request:", error);
    return NextResponse.json(
      {
        error:
            Error("An error occurred while processing the request. Please try again later."),
      },
      { status: 400 }
    );
  }
}