import request from '@/config/axios'

/**
 * ERP 产品单位 VO
 *
 * 产品单位是产品的计量单位,如:个、箱、吨、米等
 */
export interface ProductUnitVO {
  id: number // 单位编号
  name: string // 单位名字
  status: number // 单位状态(0:禁用 1:启用)
}

/**
 * ERP 产品单位 API
 *
 * 提供产品单位的CRUD操作接口
 */
export const ProductUnitApi = {
  /**
   * 查询产品单位分页
   *
   * @param params 分页查询参数
   * @returns 分页结果
   */
  getProductUnitPage: async (params: any) => {
    return await request.get({ url: `/erp/product-unit/page`, params })
  },

  /**
   * 查询产品单位精简列表
   *
   * 只返回启用状态的单位,用于下拉选择
   *
   * @returns 单位列表(仅包含id和name)
   */
  getProductUnitSimpleList: async () => {
    return await request.get({ url: `/erp/product-unit/simple-list` })
  },

  /**
   * 查询产品单位详情
   *
   * @param id 单位编号
   * @returns 单位详情
   */
  getProductUnit: async (id: number) => {
    return await request.get({ url: `/erp/product-unit/get?id=` + id })
  },

  /**
   * 新增产品单位
   *
   * @param data 单位信息
   * @returns 新增的单位编号
   */
  createProductUnit: async (data: ProductUnitVO) => {
    return await request.post({ url: `/erp/product-unit/create`, data })
  },

  /**
   * 修改产品单位
   *
   * @param data 单位信息
   */
  updateProductUnit: async (data: ProductUnitVO) => {
    return await request.put({ url: `/erp/product-unit/update`, data })
  },

  /**
   * 删除产品单位
   *
   * 注意:被产品使用的单位不能删除
   *
   * @param id 单位编号
   */
  deleteProductUnit: async (id: number) => {
    return await request.delete({ url: `/erp/product-unit/delete?id=` + id })
  },

  /**
   * 导出产品单位 Excel
   *
   * @param params 查询参数
   * @returns Excel文件流
   */
  exportProductUnit: async (params) => {
    return await request.download({ url: `/erp/product-unit/export-excel`, params })
  }
}
