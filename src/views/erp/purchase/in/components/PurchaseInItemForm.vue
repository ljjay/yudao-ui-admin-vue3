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
    <el-table :data="formData" show-summary :summary-method="getSummaries" class="-mt-10px">
      <el-table-column label="序号" type="index" align="center" width="60" />
      <el-table-column label="仓库名称" min-width="125">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.warehouseId`"
            :rules="formRules.warehouseId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.warehouseId"
              clearable
              filterable
              placeholder="请选择仓库"
              @change="onChangeWarehouse($event, row)"
            >
              <el-option
                v-for="item in warehouseList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" min-width="180">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productName" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="库存" min-width="100">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.stockCount" :formatter="erpCountInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="条码" min-width="150">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productBarCode" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="单位" min-width="80">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productUnitName" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column
        label="原数量"
        fixed="right"
        min-width="80"
        v-if="formData[0]?.totalCount != null"
      >
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.totalCount" :formatter="erpCountInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column
        label="已入库"
        fixed="right"
        min-width="80"
        v-if="formData[0]?.inCount != null"
      >
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.inCount" :formatter="erpCountInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="数量" prop="count" fixed="right" min-width="140">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.count`" :rules="formRules.count" class="mb-0px!">
            <el-input-number
              v-model="row.count"
              controls-position="right"
              :min="0.001"
              :precision="3"
              class="!w-100%"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品单价" fixed="right" min-width="120">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.productPrice`" class="mb-0px!">
            <el-input-number
              v-model="row.productPrice"
              controls-position="right"
              :min="0.00"
              :precision="2"
              class="!w-100%"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="金额" prop="totalProductPrice" fixed="right" min-width="100">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.totalProductPrice`" class="mb-0px!">
            <el-input
              disabled
              v-model="row.totalProductPrice"
              :formatter="erpPriceInputFormatter"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="税率（%）" fixed="right" min-width="115">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.taxPercent`" class="mb-0px!">
            <el-input-number
              v-model="row.taxPercent"
              controls-position="right"
              :min="0"
              :precision="2"
              class="!w-100%"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="税额" prop="taxPrice" fixed="right" min-width="120">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.taxPrice`" class="mb-0px!">
            <el-form-item :prop="`${$index}.taxPrice`" class="mb-0px!">
              <el-input disabled v-model="row.taxPrice" :formatter="erpPriceInputFormatter" />
            </el-form-item>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="税额合计" prop="totalPrice" fixed="right" min-width="100">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.totalPrice`" class="mb-0px!">
            <el-input disabled v-model="row.totalPrice" :formatter="erpPriceInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="保修天数" min-width="100">
        <template #default="{ row, $index }">
          <!-- 根据管理类型决定是否显示保修天数字段 -->
          <el-form-item 
            v-if="row.manageType === 20 || row.manageType === 30" 
            :prop="`${$index}.warrantyPeriodDays`" 
            :rules="[{ required: true, message: '保修天数不能为空', trigger: 'blur' }]"
            class="mb-0px!"
          >
            <el-input-number
              v-model="row.warrantyPeriodDays"
              controls-position="right"
              :min="1"
              :precision="0"
              placeholder="请输入保修天数"
              class="!w-100%"
            />
          </el-form-item>
          <el-form-item v-else class="mb-0px!">
            <el-input v-model="row.warrantyPeriodDays" disabled />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.remark`" class="mb-0px!">
            <el-input v-model="row.remark" placeholder="请输入备注" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="一物一码" min-width="120" fixed="right">
        <template #default="{ row, $index }">
          <!-- 只有一物一码管理才显示输入按钮 -->
          <el-form-item
            v-if="row.manageType === 30"
            :prop="`${$index}.uniqueCodes`"
            :rules="[{
              validator: (rule, value, callback) => {
                // 允许不输入（自动生成模式）
                if (!value || value.length === 0) {
                  callback()
                } else if (value.length !== Math.floor(row.count)) {
                  // 如果输入了，则必须匹配数量
                  callback(new Error(`需要输入${Math.floor(row.count)}个唯一码`))
                } else {
                  callback()
                }
              },
              trigger: 'change'
            }]"
            class="mb-0px!"
          >
            <el-button @click="openUniqueCodeInputDialog(row)" type="primary" link>
              {{ row.uniqueCodes && row.uniqueCodes.length > 0 ? `已输入${row.uniqueCodes.length}个` : '自动生成' }}
            </el-button>
          </el-form-item>
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button :disabled="formData.length === 1" @click="handleDelete($index)" link>
            —
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>

  <!-- 一物一码输入对话框 -->
  <el-dialog
    v-model="uniqueCodeDialogVisible"
    title="一物一码设置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-alert
      title="提示"
      type="info"
      :closable="false"
      style="margin-bottom: 15px"
    >
      可以选择手动输入唯一码，或留空自动生成（审批时生成）
    </el-alert>
    <el-form :model="uniqueCodeForm" label-width="120px">
      <el-form-item label="产品名称">
        <el-input :value="currentRow?.productName" disabled />
      </el-form-item>
      <el-form-item label="需要数量">
        <el-input :value="currentRow ? Math.floor(currentRow.count) : 0" disabled />
      </el-form-item>
      <el-form-item label="唯一码列表">
        <el-input
          v-model="uniqueCodeForm.codesText"
          type="textarea"
          :rows="10"
          placeholder="每行输入一个唯一码（条形码/二维码/RFID等），留空则审批时自动生成"
        />
        <div class="text-gray-400 text-sm mt-2">
          已输入：{{ uniqueCodeForm.codesText.split('\n').filter(c => c.trim()).length }} 个
          <span v-if="uniqueCodeForm.codesText.split('\n').filter(c => c.trim()).length === 0" class="text-blue-500">
            （将自动生成）
          </span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="uniqueCodeDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmUniqueCodeInput">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { StockApi } from '@/api/erp/stock/stock'
import {
  erpCountInputFormatter,
  erpPriceInputFormatter,
  erpPriceMultiply,
  getSumValue
} from '@/utils'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'

const props = defineProps<{
  items: any[]
  disabled: boolean
}>()
const message = useMessage() // 消息弹窗
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

// 一物一码输入对话框相关
const uniqueCodeDialogVisible = ref(false) // 一物一码输入对话框是否显示
const currentRow = ref<any>(null) // 当前操作的行
const uniqueCodeForm = reactive({
  codesText: '' // 唯一码文本（每行一个）
})

// 新增：重置仓库列表的方法
const resetWarehouseList = async (isReset: boolean ,newDeptId: number) => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleListByDeptId(newDeptId)
  defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
  // 新增：清空所有行仓库的选中
  if (isReset) {
    formData.value.forEach(row => {
      row.warehouseId = undefined
    })
  }
}


/** 初始化设置入库项 */
watch(
  () => props.items,
  async (val) => {
    val.forEach((item) => {
      if (item.warehouseId == null) {
        item.warehouseId = defaultWarehouse.value?.id
      }
      if (item.stockCount === null && item.warehouseId != null) {
        setStockCount(item)
      }
      // 确保新字段存在，如果后端没有返回则设置默认值
      if (item.warrantyPeriodDays === undefined) {
        item.warrantyPeriodDays = undefined
      }
      if (item.manageType === undefined) {
        item.manageType = undefined
      }
      // 初始化一物一码字段
      if (item.uniqueCodes === undefined) {
        item.uniqueCodes = []
      }
    })
    formData.value = val
  },
  { immediate: true }
)

/** 监听合同产品变化，计算合同产品总价 */
watch(
  () => formData.value,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    // 循环处理
    val.forEach((item) => {
      item.totalProductPrice = erpPriceMultiply(item.productPrice, item.count)
      item.taxPrice = erpPriceMultiply(item.totalProductPrice, item.taxPercent / 100.0)
      if (item.totalProductPrice != null) {
        item.totalPrice = item.totalProductPrice + (item.taxPrice || 0)
      } else {
        item.totalPrice = undefined
      }
    })
  },
  { deep: true }
)

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

/** 新增按钮操作 */
const handleAdd = () => {
  const row = {
    id: undefined,
    productId: undefined,
    productUnitName: undefined, // 产品单位
    productBarCode: undefined, // 产品条码
    productPrice: undefined,
    stockCount: undefined,
    count: 1,
    totalProductPrice: undefined,
    taxPercent: undefined,
    taxPrice: undefined,
    totalPrice: undefined,
    remark: undefined,
    warrantyPeriodDays: undefined,
    manageType: undefined // 管理类型，用于决定是否显示保修天数字段
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
  const count = await StockApi.getStock2(row.productId,row.warehouseId)
  row.stockCount = count ? count.count : 0

}

/** 打开一物一码输入对话框 */
const openUniqueCodeInputDialog = (row: any) => {
  currentRow.value = row
  // 如果之前已经输入过唯一码，加载到对话框中
  if (row.uniqueCodes && row.uniqueCodes.length > 0) {
    uniqueCodeForm.codesText = row.uniqueCodes.join('\n')
  } else {
    uniqueCodeForm.codesText = ''
  }
  uniqueCodeDialogVisible.value = true
}

/** 确认输入一物一码 */
const confirmUniqueCodeInput = () => {
  if (!currentRow.value) {
    return
  }

  // 解析输入的唯一码（每行一个，去除空行和前后空格）
  const codes = uniqueCodeForm.codesText
    .split('\n')
    .map(code => code.trim())
    .filter(code => code.length > 0)

  const requiredCount = Math.floor(currentRow.value.count)

  // 如果没有输入任何唯一码，则使用自动生成模式
  if (codes.length === 0) {
    currentRow.value.uniqueCodes = []
    uniqueCodeDialogVisible.value = false
    currentRow.value = null
    uniqueCodeForm.codesText = ''
    message.success('已设置为自动生成模式')
    return
  }

  // 如果输入了唯一码，则校验数量必须匹配
  if (codes.length !== requiredCount) {
    message.warning(`需要输入${requiredCount}个唯一码，当前输入了${codes.length}个`)
    return
  }

  // 校验唯一码是否有重复
  const uniqueCodes = new Set(codes)
  if (uniqueCodes.size !== codes.length) {
    message.warning('唯一码中存在重复，请检查')
    return
  }

  // 保存到当前行
  currentRow.value.uniqueCodes = codes

  // 关闭对话框
  uniqueCodeDialogVisible.value = false
  currentRow.value = null
  uniqueCodeForm.codesText = ''

  message.success('唯一码设置成功')
}

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}
defineExpose({ validate ,resetWarehouseList})

/** 初始化 */
onMounted(async () => {
  //warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
  //defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
})
</script>
