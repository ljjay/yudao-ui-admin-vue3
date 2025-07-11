<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    v-loading="formLoading"
    label-width="0px"
    :inline-message="true"
    :disabled="disabled"
  >
    <el-table :data="formData" class="-mt-10px">
      <el-table-column label="序号" type="index" align="center" width="50" />
      <el-table-column label="项目编号" min-width="80" prop="itemCode">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input v-model="row.itemCode" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="项目名称" min-width="120" prop="itemName">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input v-model="row.itemName" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="项目描述" min-width="250" prop="itemDesc">
        <template #default="{ row }">
          <el-form-item :prop="`${$index}.itemDesc`" class="mb-0px!">
            <el-input
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 3 }"
              v-model="row.itemDesc"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="项目排序" min-width="70" prop="itemSort">
        <template #default="{ row }">
          <el-form-item :prop="`${$index}.itemSort`" class="mb-0px!">
            <el-input v-model="row.itemSort" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button @click="handleDelete($index)" link>—</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加项目</el-button>
  </el-row>
</template>
<script setup lang="ts">
import { StockApi } from '@/api/erp/stock/stock'
import { erpCountInputFormatter, erpPriceInputFormatter, getSumValue } from '@/utils'

import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'

const props = defineProps<{
  items: undefined
  disabled: false
  deptId: undefined
}>()

const formLoading = ref(false) // 表单的加载中
const formData = ref([])
const formRules = reactive({
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'blur' }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  count: [{ required: true, message: '产品数量不能为空', trigger: 'blur' }]
})
const formRef = ref([]) // 表单 Ref
const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表
const defaultWarehouse = ref<WarehouseVO>(undefined) // 默认仓库

// 新增：重置仓库列表的方法
const resetWarehouseList = async (isReset: boolean, newDeptId: number) => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleListByDeptId(newDeptId)
  defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
  // 新增：清空所有行仓库的选中
  if (isReset) {
    formData.value.forEach((row) => {
      row.warehouseId = undefined
    })
  }
}

/** 初始化设置入库项 */
watch(
  () => props.items,
  async (val) => {
    formData.value = val
  },
  { immediate: true }
)

// // /** 监听合同产品变化，计算合同产品总价 */
// watch(
//   () => formData.value,
//   (val) => {
//     if (!val || val.length === 0) {
//       return
//     }
//     // 循环处理
//     val.forEach((item) => {
//       item.totalProductPrice = erpPriceMultiply(item.productPrice, item.count)
//       item.taxPrice = erpPriceMultiply(item.totalProductPrice, item.taxPercent / 100.0)
//       if (item.totalProductPrice != null) {
//         item.totalPrice = item.totalProductPrice + (item.taxPrice || 0)
//       } else {
//         item.totalPrice = undefined
//       }
//     })
//   },
//   { deep: true }
// )

/** 合计 */
const getSummaries = (param: SummaryMethodProps) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['count', 'totalProductPrice', 'taxPrice', 'totalPrice'].includes(column.property)) {
      const sum = getSumValue(data.map((item) => Number(item[column.property])))
      sums[index] =
        column.property === 'count' ? erpCountInputFormatter(sum) : erpPriceInputFormatter(sum)
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// /** 新增按钮操作 */
// const handleAdd = () => {
//   const row = {
//     id: undefined,
//     productId: undefined,
//     productUnitName: undefined, // 产品单位
//     productBarCode: undefined, // 产品条码
//     productPrice: undefined,
//     stockCount: undefined,
//     count: 1,
//     totalProductPrice: undefined,
//     taxPercent: undefined,
//     taxPrice: undefined,
//     totalPrice: undefined,
//     remark: undefined
//   }
//   formData.value.push(row)
// }

/** 新增按钮操作 */
const handleAdd = () => {
  const row = {
    id: undefined,
    itemCode: undefined,
    itemName: undefined,
    itemDesc: undefined,
    itemSort: undefined,
    status: 0,
    count: 1
  }
  formData.value.push(row)
}

/** 删除按钮操作 */
const handleDelete = (index: number) => {
  formData.value.splice(index, 1)
}

/** 处理仓库变更 */
const onChangeWarehouse = (warehouseId, row) => {
  // 加载库存
  setStockCount(row)
}

/** 加载库存 */
const setStockCount = async (row: any) => {
  if (!row.productId) {
    return
  }
  //const count = await StockApi.getStockCount(row.productId)
  //row.stockCount = count || 0
  const count = await StockApi.getStock2(row.productId, row.warehouseId)
  row.stockCount = count ? count.count : 0
}

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}
defineExpose({ validate, resetWarehouseList })

/** 初始化 */
onMounted(async () => {
  //warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
  //defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
})
</script>
