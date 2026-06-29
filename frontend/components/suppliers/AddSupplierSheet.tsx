'use client'

import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, FileText, X, Sparkles, AlertCircle } from 'lucide-react'
import { create, extractFromDoc, extractFromText, type ExtractedSupplierData } from '@/lib/api/suppliers'
import { extractFromPdf } from '@/lib/pdf-extract'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'FOOD_BEVERAGE',         label: 'Food & Beverage' },
  { value: 'RAW_MATERIALS',         label: 'Raw Materials' },
  { value: 'LOGISTICS',             label: 'Logistics' },
  { value: 'TECHNOLOGY',            label: 'Technology' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
  { value: 'UTILITIES',             label: 'Utilities' },
  { value: 'OTHER',                 label: 'Other' },
] as const

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.webp'

const EMPTY_FORM = {
  name: '',
  category: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  country: '',
  contractExpiry: '',
}

// ── Styles ───────────────────────────────────────────────────────────────────

const baseFieldClass =
  'h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-60 transition-colors'

function fieldClass(isAiFilled: boolean) {
  return isAiFilled
    ? `${baseFieldClass} border-blue-400 ring-1 ring-blue-200 bg-blue-50/30 focus:ring-blue-500 focus:border-blue-500`
    : `${baseFieldClass} border-slate-300 focus:ring-blue-500 focus:border-blue-500`
}

const LABEL_CLASS = 'flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1'

// ── Component ─────────────────────────────────────────────────────────────────

export function AddSupplierSheet() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // tracks which fields were auto-filled by AI (highlights them)
  const [aiFilled, setAiFilled] = useState<Set<string>>(new Set())
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isConvertingPdf, setIsConvertingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // ── Extract mutation ───────────────────────────────────────────────────────

  const extractMutation = useMutation({
    mutationFn: (arg: File | { text: string }) =>
      arg instanceof File ? extractFromDoc(arg) : extractFromText(arg.text),
    onSuccess: (data: ExtractedSupplierData) => {
      const filledFields = new Set<string>()
      const updates: Partial<typeof EMPTY_FORM> = {}

      if (data.name)          { updates.name          = data.name;          filledFields.add('name') }
      if (data.category)      { updates.category      = data.category;      filledFields.add('category') }
      if (data.contactEmail)  { updates.contactEmail  = data.contactEmail;  filledFields.add('contactEmail') }
      if (data.contactPhone)  { updates.contactPhone  = data.contactPhone;  filledFields.add('contactPhone') }
      if (data.website)       { updates.website       = data.website;       filledFields.add('website') }
      if (data.country)       { updates.country       = data.country;       filledFields.add('country') }
      if (data.contractExpiry){ updates.contractExpiry= data.contractExpiry;filledFields.add('contractExpiry') }

      setForm(f => ({ ...f, ...updates }))
      setAiFilled(filledFields)
      // clear field-level errors for newly filled fields
      setErrors(prev => {
        const next = { ...prev }
        filledFields.forEach(k => delete next[k])
        return next
      })
    },
    onError: () => {
      setErrors(prev => ({ ...prev, _extract: 'Could not read the document. Please fill in the form manually.' }))
    },
  })

  // ── Submit mutation ────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      handleClose()
    },
    onError: () => {
      setErrors(prev => ({ ...prev, _form: 'Something went wrong. Please try again.' }))
    },
  })

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setForm(EMPTY_FORM)
      setErrors({})
      setAiFilled(new Set())
      setUploadFile(null)
      setIsConvertingPdf(false)
    }, 200)
  }

  function setField(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setAiFilled(prev => { const next = new Set(prev); next.delete(field); return next })
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  async function handleFileSelect(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, _extract: 'Unsupported file type. Use PDF, JPG, PNG, or WebP.' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, _extract: 'File is too large. Maximum size is 10 MB.' }))
      return
    }
    setErrors(prev => { const n = { ...prev }; delete n._extract; return n })
    setUploadFile(file)

    if (file.type === 'application/pdf') {
      setIsConvertingPdf(true)
      try {
        const result = await extractFromPdf(file)
        setIsConvertingPdf(false)
        if (result.type === 'text') {
          extractMutation.mutate({ text: result.text })
        } else {
          extractMutation.mutate(result.file)
        }
      } catch {
        setIsConvertingPdf(false)
        setErrors(prev => ({ ...prev, _extract: 'Could not process PDF. Try uploading as JPG or PNG instead.' }))
      }
      return
    }

    extractMutation.mutate(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Supplier name is required'
    if (!form.category) errs.category = 'Category is required'
    if (!form.contactEmail.trim()) {
      errs.contactEmail = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errs.contactEmail = 'Enter a valid email address'
    }
    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      errs.website = 'Website must start with http:// or https://'
    }
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    createMutation.mutate({
      name: form.name.trim(),
      category: form.category,
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim() || undefined,
      website: form.website.trim() || undefined,
      country: form.country.trim() || undefined,
      contractExpiry: form.contractExpiry || undefined,
    })
  }

  const isExtracting = extractMutation.isPending || isConvertingPdf
  const isSubmitting = createMutation.isPending
  const isBusy = isExtracting || isSubmitting
  const filledCount = aiFilled.size

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      {/* Floating action button */}
      <button
        type="button"
        aria-label="Add new supplier"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 pl-4 pr-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:bottom-8 sm:right-8"
      >
        <Plus className="size-5 shrink-0" aria-hidden />
        <span>Add Supplier</span>
      </button>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full">

          {/* Header */}
          <SheetHeader className="border-b border-slate-100 px-6 py-5 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Add New Supplier
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500">
              Upload an invoice or document to auto-fill, or fill in manually.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── Upload zone ── */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="sr-only"
                aria-label="Upload document"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
              />

              {!uploadFile && !isExtracting ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'}`}
                >
                  <Upload className="mx-auto size-6 text-slate-400 mb-2" aria-hidden />
                  <p className="text-sm font-medium text-slate-700">Upload invoice or document</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, WebP · max 10 MB</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">AI will auto-fill the form</p>
                </button>
              ) : isExtracting ? (
                <div className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-5 flex items-center gap-3">
                  <span className="size-5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-blue-800">
                      {isConvertingPdf ? 'Processing PDF pages…' : 'Reading document…'}
                    </p>
                    <p className="text-xs text-blue-500 truncate">{uploadFile?.name}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
                  <FileText className="size-5 text-slate-400 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{uploadFile?.name}</p>
                    {filledCount > 0 && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        <Sparkles className="inline size-3 mr-0.5" aria-hidden />
                        {filledCount} field{filledCount !== 1 ? 's' : ''} auto-filled — review and edit below
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove uploaded file"
                    onClick={() => {
                      setUploadFile(null)
                      setAiFilled(new Set())
                      setForm(EMPTY_FORM)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              )}

              {errors._extract && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-xs text-amber-700">{errors._extract}</p>
                </div>
              )}
            </div>

            {/* ── AI-filled notice ── */}
            {filledCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <Sparkles className="size-4 text-blue-500 shrink-0" aria-hidden />
                <p className="text-xs text-blue-700">
                  Fields with a blue highlight were filled by AI. Edit any that look wrong.
                </p>
              </div>
            )}

            {/* ── Required fields ── */}
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Required</p>

              {/* Name */}
              <div>
                <label htmlFor="sup-name" className={LABEL_CLASS}>
                  Supplier Name
                  <span className="text-red-500 ml-0.5">*</span>
                  {aiFilled.has('name') && <AiBadge />}
                </label>
                <input
                  id="sup-name"
                  type="text"
                  placeholder="e.g. FreshFarm Produce Co."
                  value={form.name}
                  onChange={setField('name')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('name'))}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'sup-name-err' : undefined}
                />
                {errors.name && <p id="sup-name-err" className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="sup-category" className={LABEL_CLASS}>
                  Category
                  <span className="text-red-500 ml-0.5">*</span>
                  {aiFilled.has('category') && <AiBadge />}
                </label>
                <select
                  id="sup-category"
                  value={form.category}
                  onChange={setField('category')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('category'))}
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'sup-cat-err' : undefined}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p id="sup-cat-err" className="mt-1 text-xs text-red-500">{errors.category}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="sup-email" className={LABEL_CLASS}>
                  Contact Email
                  <span className="text-red-500 ml-0.5">*</span>
                  {aiFilled.has('contactEmail') && <AiBadge />}
                </label>
                <input
                  id="sup-email"
                  type="email"
                  placeholder="orders@supplier.com"
                  value={form.contactEmail}
                  onChange={setField('contactEmail')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('contactEmail'))}
                  aria-invalid={!!errors.contactEmail}
                  aria-describedby={errors.contactEmail ? 'sup-email-err' : undefined}
                />
                {errors.contactEmail && <p id="sup-email-err" className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
              </div>
            </div>

            {/* ── Optional fields ── */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Optional</p>

              {/* Phone */}
              <div>
                <label htmlFor="sup-phone" className={LABEL_CLASS}>
                  Contact Phone
                  {aiFilled.has('contactPhone') && <AiBadge />}
                </label>
                <input
                  id="sup-phone"
                  type="tel"
                  placeholder="+1-800-555-0100"
                  value={form.contactPhone}
                  onChange={setField('contactPhone')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('contactPhone'))}
                />
              </div>

              {/* Website */}
              <div>
                <label htmlFor="sup-website" className={LABEL_CLASS}>
                  Website
                  {aiFilled.has('website') && <AiBadge />}
                </label>
                <input
                  id="sup-website"
                  type="url"
                  placeholder="https://supplier.com"
                  value={form.website}
                  onChange={setField('website')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('website'))}
                  aria-invalid={!!errors.website}
                  aria-describedby={errors.website ? 'sup-web-err' : undefined}
                />
                {errors.website && <p id="sup-web-err" className="mt-1 text-xs text-red-500">{errors.website}</p>}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="sup-country" className={LABEL_CLASS}>
                  Country
                  {aiFilled.has('country') && <AiBadge />}
                </label>
                <input
                  id="sup-country"
                  type="text"
                  placeholder="US"
                  value={form.country}
                  onChange={setField('country')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('country'))}
                />
              </div>

              {/* Contract Expiry */}
              <div>
                <label htmlFor="sup-expiry" className={LABEL_CLASS}>
                  Contract Expiry Date
                  {aiFilled.has('contractExpiry') && <AiBadge />}
                </label>
                <input
                  id="sup-expiry"
                  type="date"
                  value={form.contractExpiry}
                  onChange={setField('contractExpiry')}
                  disabled={isBusy}
                  className={fieldClass(aiFilled.has('contractExpiry'))}
                />
              </div>
            </div>

            {/* Submit error */}
            {errors._form && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" aria-hidden />
                <p className="text-xs text-red-700">{errors._form}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <SheetFooter className="border-t border-slate-100 px-6 py-4 shrink-0 flex-row gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="flex-1 h-9 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 h-9 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </>
              ) : (
                'Add Supplier'
              )}
            </button>
          </SheetFooter>

        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── AI badge ──────────────────────────────────────────────────────────────────

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
      <Sparkles className="size-2.5" aria-hidden />
      AI
    </span>
  )
}
