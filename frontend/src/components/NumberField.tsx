import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui-components/react/number-field';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';

/**
 * This component is a placeholder for FormControl to correctly set the shrink label state on SSR.
 */
function SSRInitialFilled(_: BaseNumberField.Root.Props) {
  return null;
}
SSRInitialFilled.muiName = 'Input';

export default function NumberField({
  id: idProp,
  label,
  error,
  size = 'medium',
  ...other
}: BaseNumberField.Root.Props & {
  label?: React.ReactNode;
  size?: 'small' | 'medium';
  error?: boolean;
}) {
  let id = React.useId();
  if (idProp) {
    id = idProp;
  }
  return (
    <BaseNumberField.Root
      allowWheelScrub
      {...other}
      render={(props: { ref: React.Ref<HTMLDivElement> | undefined; children: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, state: { disabled: boolean | undefined; required: boolean | undefined; }) => (
        <FormControl
          size={size}
          ref={props.ref}
          disabled={state.disabled}
          required={state.required}
          error={error}
          variant="outlined"
        >
          {props.children}
        </FormControl>
      )}
    >
      <SSRInitialFilled {...other} />
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <BaseNumberField.Input
        id={id}
        render={(props: { ref: React.Ref<any> | undefined; onBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined; onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined; onKeyUp: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined; onKeyDown: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined; onFocus: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined; }, state: { inputValue: unknown; }) => (
          <OutlinedInput
            label={label}
            inputRef={props.ref}
            value={state.inputValue}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onKeyUp={props.onKeyUp}
            onKeyDown={props.onKeyDown}
            onFocus={props.onFocus}
            slotProps={{
              input: props,
            }}
          />
        )}
      />
      <FormHelperText sx={{ ml: 0, '&:empty': { mt: 0 } }}>
        Enter value between 10 and 40
      </FormHelperText>
    </BaseNumberField.Root>
  );
}
