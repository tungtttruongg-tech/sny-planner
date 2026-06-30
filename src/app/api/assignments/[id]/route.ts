import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await prisma.machineAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE_ASSIGNMENT]", error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });

    const body = await request.json();
    const { orderId, endDate, estimatedDailyOutput } = body;

    const existing = await prisma.machineAssignment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    const start = existing.startDate;
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { message: "Start date must be before or equal to end date" },
        { status: 400 }
      );
    }

    // Overlap check excluding current assignment
    const overlap = await prisma.machineAssignment.findFirst({
      where: {
        machineId: existing.machineId,
        id: { not: id },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlap) {
      return NextResponse.json(
        { message: "Máy đã được xếp lịch trong khoảng thời gian này" },
        { status: 409 }
      );
    }

    const updated = await prisma.machineAssignment.update({
      where: { id },
      data: {
        orderId,
        endDate: end,
        // Cập nhật sản lượng dự kiến nếu client gửi lên (undefined = giữ nguyên)
        ...(estimatedDailyOutput !== undefined && {
          estimatedDailyOutput: estimatedDailyOutput === null ? null : estimatedDailyOutput,
        }),
      },
      include: { order: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH_ASSIGNMENT]", error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: "Order is already assigned to a machine" }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
