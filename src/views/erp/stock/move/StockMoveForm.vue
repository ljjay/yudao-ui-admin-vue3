<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1080">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="调度单号" prop="no">
            <el-input disabled v-model="formData.no" placeholder="保存时自动生成" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调度时间" prop="moveTime">
            <el-date-picker
              v-model="formData.moveTime"
              type="date"
              value-format="x"
              placeholder="选择调度时间"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="formData.remark"
              :rows="1"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调出单位" prop="deptId">
            <el-tree-select
              v-model="formData.deptId"
              :data="deptIdTreeData"
              :props="defaultProps"
              :render-after-expand="false"
              check-on-click-node
              check-strictly
              style="width: 240px"
              @change="(value) => handleDeptChange('from', value)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调入单位" prop="toDeptId">
            <el-tree-select
              v-model="formData.toDeptId"
              :data="deptIdTreeData"
              :props="defaultProps"
              :render-after-expand="false"
              check-on-click-node
              check-strictly
              style="width: 240px"
              @change="(value) => handleDeptChange('to', value)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="附件" prop="fileUrl">
            <UploadFile :is-show-tip="false" v-model="formData.fileUrl" :limit="1" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 子表的表单 -->
    <ContentWrap>
      <el-tabs v-model="subTabsName" class="-mt-15px -mb-10px">
        <el-tab-pane label="调度产品清单" name="item">
          <StockMoveItemForm
            ref="itemFormRef"
            :items="formData.items"
            :disabled="disabled"
            :dept-id="formData.deptId"
            :to-dept-id="formData.toDeptId"
          />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!disabled">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { StockMoveApi, type StockMoveVO } from '@/api/erp/stock/move'
import StockMoveItemForm from './components/StockMoveItemForm.vue'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import { useMessage } from '@/hooks/web/useMessage'

/** ERP 库存调度单表单 */
defineOptions({ name: 'StockMoveForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
type StockMoveFormState = StockMoveVO & { fileUrl: string | string[] }

const formData = ref<StockMoveFormState>({
  id: undefined,
  customerId: undefined,
  moveTime: undefined,
  remark: undefined,
  fileUrl: '',
  deptId: undefined as unknown as number,
  toDeptId: undefined as unknown as number,
  items: []
})
const formRules = reactive({
  moveTime: [{ required: true, message: '调度时间不能为空', trigger: 'blur' }],
  deptId: [{ required: true, message: '调出单位不能为空', trigger: 'change' }],
  toDeptId: [{ required: true, message: '调入单位不能为空', trigger: 'change' }]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref() // 表单 Ref
const deptIdTreeData = ref<any[]>([]) // 部门树形结构

/** 子表的表单 */
const subTabsName = ref('item')
const itemFormRef = ref<any>()

/** 打开弹窗 */
const open = async (row, type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  await getDeptIdTreeData()
  const fromDept = row?.deptId ?? formData.value.deptId
  const toDept = row?.toDeptId ?? formData.value.toDeptId
  if (itemFormRef.value) {
    if (fromDept) {
      await itemFormRef.value.resetWarehouseList(false, 'from', fromDept)
    }
    if (toDept) {
      await itemFormRef.value.resetWarehouseList(false, 'to', toDept)
    }
  }
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const detail = await StockMoveApi.getStockMove(id)
      formData.value = {
        ...detail,
        fileUrl: detail.fileUrl ?? '',
        items: detail.items || []
      }
      await nextTick()
      if (itemFormRef.value) {
        await itemFormRef.value.resetWarehouseList(false, 'from', formData.value.deptId)
        await itemFormRef.value.resetWarehouseList(false, 'to', formData.value.toDeptId)
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 获取有权限的部门 */
const getDeptIdTreeData = async () => {
  deptIdTreeData.value = handleTree(await DeptApi.getSimpleDeptList())
}

/** 部门更改时 */
const handleDeptChange = async (type: 'from' | 'to', newDeptId: number) => {
  if (type === 'from') {
    formData.value.deptId = newDeptId
  } else {
    formData.value.toDeptId = newDeptId
  }
  if (itemFormRef.value) {
    await itemFormRef.value.resetWarehouseList(true, type, newDeptId)
  }
}


/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  await itemFormRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    const res =
      formType.value === 'create'
        ? await StockMoveApi.createStockMove(data)
        : await StockMoveApi.updateStockMove(data)
    const payload = res.data
    const hint = payload?.msg ?? payload?.message ?? res.msg
    if (formType.value === 'create') {
      message.success(t('common.createSuccess'))
    } else {
      message.success(t('common.updateSuccess'))
    }
    if (hint) {
      message.alert(hint)
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    customerId: undefined,
    moveTime: undefined,
    remark: undefined,
    fileUrl: '',
    deptId: undefined as unknown as number,
    toDeptId: undefined as unknown as number,
    items: []
  }
  formRef.value?.resetFields()
  subTabsName.value = 'item'
}

watch(
  () => formData.value.deptId,
  async (val) => {
    if (itemFormRef.value && val) {
      await itemFormRef.value.resetWarehouseList(false, 'from', val)
    }
  }
)

watch(
  () => formData.value.toDeptId,
  async (val) => {
    if (itemFormRef.value && val) {
      await itemFormRef.value.resetWarehouseList(false, 'to', val)
    }
  }
)
</script>
