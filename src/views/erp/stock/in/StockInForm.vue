<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="100%" fullscreen>
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
          <el-form-item label="入库单号" prop="no">
            <el-input disabled v-model="formData.no" placeholder="保存时自动生成"/>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库时间" prop="inTime">
            <el-date-picker
              v-model="formData.inTime"
              type="date"
              value-format="x"
              placeholder="选择入库时间"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="supplierId">
            <el-select
              v-model="formData.supplierId"
              clearable
              filterable
              placeholder="请选择供应商"
              class="!w-1/1"
            >
              <el-option
                v-for="item in supplierList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="业务类型" prop="bizType">
            <el-select
              v-model="formData.bizType"
              placeholder="请选择业务类型"
              class="!w-1/1"
            >
              <el-option label="其他入库" :value="10" />
              <el-option label="报修拆车入库" :value="90" />
              <el-option label="送修入库" :value="102" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位" prop="deptId">
            <el-tree-select
              v-model="formData.deptId"
              :data="deptIdTreeData"
              :props="defaultProps"
              :render-after-expand="false"
              check-on-click-node
              check-strictly
              style="width: 240px"
              @change="handleDeptChange"
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
          <el-form-item label="附件" prop="fileUrl">
            <UploadFile :is-show-tip="false" v-model="formData.fileUrl" :limit="1"/>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 子表的表单 -->
    <ContentWrap>
      <el-tabs v-model="subTabsName" class="-mt-15px -mb-10px">
        <el-tab-pane label="入库产品清单" name="item">
          <StockInItemForm ref="itemFormRef" :items="formData.items" :biz-type="formData.bizType" :dept-id="formData.deptId" :disabled="disabled"/>
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
import { nextTick } from 'vue'
import {StockInApi, StockInVO} from '@/api/erp/stock/in'
import StockInItemForm from './components/StockInItemForm.vue'
import {SupplierApi, SupplierVO} from '@/api/erp/purchase/supplier'
import {defaultProps, handleTree} from "@/utils/tree";
import * as DeptApi from "@/api/system/dept";

/** ERP 其它入库单 表单 */
defineOptions({name: 'StockInForm'})

const {t} = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const formData = ref({
  id: undefined,
  no: '',
  supplierId: undefined,
  inTime: undefined,
  remark: undefined,
  fileUrl: '',
  bizType: 10,
  items: [],
  deptId: undefined
})

const formRules = reactive({
  inTime: [{required: true, message: '入库时间不能为空', trigger: 'blur'}],
  deptId: [{required: true, message: '单位不能为空', trigger: 'blur'}],
  supplierId: [{required: true, message: '入库来源不能为空', trigger: 'blur'}]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref() // 表单 Ref
const supplierList = ref<SupplierVO[]>([]) // 供应商列表
const deptIdTreeData = ref<any[]>([]) // 部门树形结构

/** 子表的表单 */
const subTabsName = ref('item')
const itemFormRef = ref()

/** 打开弹窗 */
const open = async (row , type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  await getDeptIdTreeData()
  if(row != undefined && row.deptId != undefined){
    if (itemFormRef.value) {
      await itemFormRef.value.resetWarehouseList(false,row.deptId)
    }
  }
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockInApi.getStockIn(id)
    } finally {
      formLoading.value = false
    }
  }
  // 加载供应商列表
  supplierList.value = await SupplierApi.getSupplierSimpleList()
}

defineExpose({open}) // 提供 open 方法，用于打开弹窗

/** 获取有权限的部门 */
const getDeptIdTreeData = async () => {
  deptIdTreeData.value = handleTree(await DeptApi.getSimpleDeptList())
}

/** 部门更改时 */
const handleDeptChange = (newDeptId: number) => {
  if (itemFormRef.value) {
    itemFormRef.value.resetWarehouseList(true, newDeptId)
  }
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  formData.value.items = itemFormRef.value.getTableData()
  await nextTick()
  await itemFormRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as StockInVO
    if (formType.value === 'create') {
      await StockInApi.createStockIn(data)
      message.success(t('common.createSuccess'))
    } else {
      await StockInApi.updateStockIn(data)
      message.success(t('common.updateSuccess'))
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
    no: '',
    supplierId: undefined,
    inTime: undefined,
    remark: undefined,
    fileUrl: '',
    bizType: 10,
    items: [],
    deptId: undefined
  }
  formRef.value?.resetFields()
}
</script>
