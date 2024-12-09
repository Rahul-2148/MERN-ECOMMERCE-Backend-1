import { NextFunction, Request, Response } from "express";

// type of NewUser
export interface NewUserRequestBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}

// type of NewProduct
export interface NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  // shippingCost: number;
}

// type of Controller
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

// type of SearchRequestQuery
export type SearchRequestQuery = {
  search?: string;
  price?: number;
  category?: string;
  sort?: string;
  page?: String;
};

// interface for Search BaseQuery
export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

// type of Product and Order related
export type invalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
  // coupon?: string | boolean;
  // couponId?: string | string[];
};

// type of OrderItem
export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

// type of ShippingInfo
export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
  phoneNo: number;
};

// interface of Order
export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}
