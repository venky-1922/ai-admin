import { connectDB } from "@/app/lib/mongodb";
import { User } from "@/app/lib/model/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const data = body;
    const newUser = await User.create(data);
    return NextResponse.json(
      { message: "User inserted successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inserting user:", error);
    return NextResponse.json(
      { message: "Internal server error", error },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    await connectDB();
    const users = await User.find();
    return NextResponse.json(
      {
        message: "Users fetched successfully",
        users,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error occuerd", error },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateFields } = body;
    const updateUser = await User.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    );
    if (!updateUser) {
      return NextResponse.json(
        { message: "User not existed with the id " },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "User updated successfully", user: updateUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error", error },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = body;
    const userDeleted = await User.findByIdAndDelete({ _id: id });
    if (!userDeleted) {
      return NextResponse.json(
        { message: "user not found" },
        {
          status: 404,
        }
      );
    } else {
      return NextResponse.json(
        { message: "User deleted successfully" },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error },
      { status: 500 }
    );
  }
}
