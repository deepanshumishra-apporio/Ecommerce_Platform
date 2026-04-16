import { prisma } from "../lib/prisma.js";

export const getDashboard = async () => {
  const [usersCount, ordersCount, productsCount, revenue, pendingOrders, lowStockProducts] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        paymentStatus: "PAID",
      },
    }),
    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      orderBy: {
        stock: "asc",
      },
      take: 6,
      include: {
        category: true,
      },
    }),
  ]);

  return {
    usersCount,
    ordersCount,
    productsCount,
    paidRevenue: revenue._sum.totalAmount ?? 0,
    pendingOrders,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
  };
};

export const getAdminOrders = () => {
  return prisma.order.findMany({
    include: {
      user: {
        include: {
          addresses: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      transaction: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateOrderStatus = (orderId: string, status: string) => {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: status as never },
    include: {
      user: { include: { addresses: true } },
      items: { include: { product: { include: { category: true } } } },
      transaction: true,
    },
  });
};

export const getAdminUsers = () => {
  return prisma.user.findMany({
    include: {
      _count: {
        select: {
          orders: true,
          reviews: true,
          addresses: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
