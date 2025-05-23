import { describe, expect, it, vi } from 'vitest'

import { FormApi } from '../FormApi'
import { FieldApi } from '../FieldApi'
import { sleep } from './utils'

describe('field api', () => {
  it('should have an initial value', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
    })

    expect(field.getValue()).toBe('test')
  })

  it('should use field default value first', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      defaultValue: 'other',
      name: 'name',
    })

    expect(field.getValue()).toBe('other')
  })

  it('should get default meta', () => {
    const form = new FormApi()
    const field = new FieldApi({
      form,
      name: 'name',
    })

    expect(field.getMeta()).toEqual({
      isTouched: false,
      isValidating: false,
      touchedErrors: [],
      errors: [],
      errorMap: {},
    })
  })

  it('should allow to set default meta', () => {
    const form = new FormApi()
    const field = new FieldApi({
      form,
      name: 'name',
      defaultMeta: { isTouched: true },
    })

    expect(field.getMeta()).toEqual({
      isTouched: true,
      isValidating: false,
      touchedErrors: [],
      errors: [],
      errorMap: {},
    })
  })

  it('should set a value correctly', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
    })

    field.setValue('other')

    expect(field.getValue()).toBe('other')
  })

  it('should push an array value correctly', () => {
    const form = new FormApi({
      defaultValues: {
        names: ['one'],
      },
    })

    const field = new FieldApi({
      form,
      name: 'names',
    })

    field.pushValue('other')

    expect(field.getValue()).toStrictEqual(['one', 'other'])
  })

  it('should insert a value into an array value correctly', () => {
    const form = new FormApi({
      defaultValues: {
        names: ['one', 'two'],
      },
    })

    const field = new FieldApi({
      form,
      name: 'names',
    })

    field.insertValue(1, 'other')

    expect(field.getValue()).toStrictEqual(['one', 'other'])
  })

  it('should remove a value from an array value correctly', () => {
    const form = new FormApi({
      defaultValues: {
        names: ['one', 'two'],
      },
    })

    const field = new FieldApi({
      form,
      name: 'names',
    })

    field.removeValue(1)

    expect(field.getValue()).toStrictEqual(['one'])
  })

  it('should swap a value from an array value correctly', () => {
    const form = new FormApi({
      defaultValues: {
        names: ['one', 'two'],
      },
    })

    const field = new FieldApi({
      form,
      name: 'names',
    })

    field.swapValues(0, 1)

    expect(field.getValue()).toStrictEqual(['two', 'one'])
  })

  it('should not throw errors when no meta info is stored on a field and a form re-renders', async () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
    })

    field.mount()

    expect(() =>
      form.update({
        defaultValues: {
          name: 'other',
        },
      }),
    ).not.toThrow()
  })

  it('should run validation onChange', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onChange: ({ value }) => {
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onChange: 'Please enter a different value',
    })
  })

  it('should run async validation onChange', async () => {
    vi.useFakeTimers()

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onChangeAsync: async ({ value }) => {
          await sleep(1000)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    await vi.runAllTimersAsync()
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onChange: 'Please enter a different value',
    })
  })

  it('should run async validation onChange with debounce', async () => {
    vi.useFakeTimers()
    const sleepMock = vi.fn().mockImplementation(sleep)

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onChangeAsyncDebounceMs: 1000,
        onChangeAsync: async ({ value }) => {
          await sleepMock(1000)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    field.setValue('other')
    await vi.runAllTimersAsync()
    // sleepMock will have been called 2 times without onChangeAsyncDebounceMs
    expect(sleepMock).toHaveBeenCalledTimes(1)
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onChange: 'Please enter a different value',
    })
  })

  it('should run async validation onChange with asyncDebounceMs', async () => {
    vi.useFakeTimers()
    const sleepMock = vi.fn().mockImplementation(sleep)

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      asyncDebounceMs: 1000,
      validators: {
        onChangeAsync: async ({ value }) => {
          await sleepMock(1000)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    field.setValue('other')
    await vi.runAllTimersAsync()
    // sleepMock will have been called 2 times without asyncDebounceMs
    expect(sleepMock).toHaveBeenCalledTimes(1)
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onChange: 'Please enter a different value',
    })
  })

  it('should run validation onBlur', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'other',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onBlur: ({ value }) => {
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    field.setValue('other', { touch: true })
    field.validate('blur')
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onBlur: 'Please enter a different value',
    })
  })

  it('should run async validation onBlur', async () => {
    vi.useFakeTimers()

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onBlurAsync: async ({ value }) => {
          await sleep(1000)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    field.validate('blur')
    await vi.runAllTimersAsync()
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onBlur: 'Please enter a different value',
    })
  })

  it('should run async validation onBlur with debounce', async () => {
    vi.useFakeTimers()
    const sleepMock = vi.fn().mockImplementation(sleep)

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onBlurAsyncDebounceMs: 1000,
        onBlurAsync: async ({ value }) => {
          await sleepMock(10)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    field.validate('blur')
    field.validate('blur')
    await vi.runAllTimersAsync()
    // sleepMock will have been called 2 times without onBlurAsyncDebounceMs
    expect(sleepMock).toHaveBeenCalledTimes(1)
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onBlur: 'Please enter a different value',
    })
  })

  it('should run async validation onBlur with asyncDebounceMs', async () => {
    vi.useFakeTimers()
    const sleepMock = vi.fn().mockImplementation(sleep)

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      asyncDebounceMs: 1000,
      validators: {
        onBlurAsync: async ({ value }) => {
          await sleepMock(10)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    field.validate('blur')
    field.validate('blur')
    await vi.runAllTimersAsync()
    // sleepMock will have been called 2 times without asyncDebounceMs
    expect(sleepMock).toHaveBeenCalledTimes(1)
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onBlur: 'Please enter a different value',
    })
  })

  it('should run async validation onSubmit', async () => {
    vi.useFakeTimers()

    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onSubmitAsync: async ({ value }) => {
          await sleep(1000)
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    expect(field.getMeta().errors.length).toBe(0)
    field.setValue('other', { touch: true })
    field.validate('submit')
    await vi.runAllTimersAsync()
    expect(field.getMeta().errors).toContain('Please enter a different value')
    expect(field.getMeta().errorMap).toMatchObject({
      onSubmit: 'Please enter a different value',
    })
  })

  it('should contain multiple errors when running validation onBlur and onChange', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'other',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onBlur: ({ value }) => {
          if (value === 'other') return 'Please enter a different value'
          return
        },
        onChange: ({ value }) => {
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    field.setValue('other', { touch: true })
    field.validate('blur')
    expect(field.getMeta().errors).toStrictEqual([
      'Please enter a different value',
      'Please enter a different value',
    ])
    expect(field.getMeta().errorMap).toEqual({
      onBlur: 'Please enter a different value',
      onChange: 'Please enter a different value',
    })
  })

  it('should reset onChange errors when the issue is resolved', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'other',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      validators: {
        onChange: ({ value }) => {
          if (value === 'other') return 'Please enter a different value'
          return
        },
      },
    })

    field.mount()

    field.setValue('other', { touch: true })
    expect(field.getMeta().errors).toStrictEqual([
      'Please enter a different value',
    ])
    expect(field.getMeta().errorMap).toEqual({
      onChange: 'Please enter a different value',
    })
    field.setValue('test', { touch: true })
    expect(field.getMeta().errors).toStrictEqual([])
    expect(field.getMeta().errorMap).toEqual({})
  })

  it('should handle default value on field using state.value', async () => {
    interface Form {
      name: string
    }
    const form = new FormApi<Form>()

    const field = new FieldApi({
      form,
      name: 'name',
      defaultValue: 'test',
    })

    field.mount()

    expect(field.state.value).toBe('test')
  })

  // test the unmounting of the fieldAPI
  it('should preserve value on unmount', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
      preserveValue: true,
    })

    const unmount = field.mount()
    unmount()
    expect(form.getFieldInfo(field.name).instance).toBeDefined()
    expect(form.getFieldInfo(field.name)).toBeDefined()
  })

  it('should not preserve field value on ummount', () => {
    const form = new FormApi({
      defaultValues: {
        name: 'test',
      },
    })

    const field = new FieldApi({
      form,
      name: 'name',
    })

    const unmount = field.mount()
    const callback = vi.fn()
    const subscription = form.store.subscribe(callback)
    unmount()
    const info = form.getFieldInfo(field.name)
    subscription()
    expect(info.instance).toBeNull()
    expect(Object.keys(info.instance ?? {}).length).toBe(0)

    // Check that form store has been updated
    expect(callback).toHaveBeenCalledOnce()

    // Field should have been removed from the form as well
    expect(form.state.values.name).toBeUndefined()
    expect(form.state.fieldMeta.name).toBeUndefined()
    expect(form.store.state.values.name).toBeUndefined()
    expect(form.store.state.fieldMeta.name).toBeUndefined()
  })

  it('should show onSubmit errors', async () => {
    const form = new FormApi({
      defaultValues: {
        firstName: '',
      },
    })

    const field = new FieldApi({
      form,
      name: 'firstName',
      validators: {
        onSubmit: ({ value }) =>
          value.length > 0 ? undefined : 'first name is required',
      },
    })

    field.mount()

    await form.handleSubmit()
    expect(field.getMeta().errors).toStrictEqual(['first name is required'])
  })

  it('should show onMount errors', async () => {
    const form = new FormApi({
      defaultValues: {
        firstName: '',
      },
    })

    const field = new FieldApi({
      form,
      name: 'firstName',
      validators: {
        onMount: ({ value }) =>
          value.length > 0 ? undefined : 'first name is required',
      },
    })

    form.mount()
    field.mount()

    expect(field.getMeta().errors).toStrictEqual(['first name is required'])
  })

  it('should cancel previous functions from an async validator with an abort signal', async () => {
    vi.useRealTimers()
    const form = new FormApi({
      defaultValues: {
        firstName: '',
      },
    })

    let resolve!: () => void
    const promise = new Promise((r) => {
      resolve = r as never
    })

    const fn = vi.fn()

    const field = new FieldApi({
      form,
      name: 'firstName',
      validators: {
        onChangeAsyncDebounceMs: 0,
        onChangeAsync: async ({ signal }) => {
          await promise
          if (signal.aborted) return
          fn()
          return undefined
        },
      },
    })

    field.mount()

    field.setValue('one', { touch: true })
    // Allow for a micro-tick to allow the promise to resolve
    await sleep(1)
    field.setValue('two', { touch: true })
    resolve()
    await sleep(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
