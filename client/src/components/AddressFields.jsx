import { Field } from './Field';

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function AddressFields({ value, onChange, errors = {} }) {
  return (
    <div className="mt-6 grid gap-7 sm:grid-cols-2">
      <Field label="Recipient name *" error={errors.fullName}>
        <input className="field" autoComplete="shipping name" value={value.fullName} onChange={(e) => onChange('fullName', e.target.value)} aria-invalid={!!errors.fullName} />
      </Field>
      <Field label="Phone *" error={errors.phone}>
        <input type="tel" className="field" autoComplete="shipping tel" placeholder="+91" value={value.phone} onChange={(e) => onChange('phone', e.target.value)} aria-invalid={!!errors.phone} />
      </Field>
      <Field label="Address line 1 *" error={errors.line1} className="sm:col-span-2">
        <input className="field" autoComplete="shipping address-line1" placeholder="House / flat, street" value={value.line1} onChange={(e) => onChange('line1', e.target.value)} aria-invalid={!!errors.line1} />
      </Field>
      <Field label="Address line 2" className="sm:col-span-2">
        <input className="field" autoComplete="shipping address-line2" placeholder="Area, landmark (optional)" value={value.line2} onChange={(e) => onChange('line2', e.target.value)} />
      </Field>
      <Field label="City *" error={errors.city}>
        <input className="field" autoComplete="shipping address-level2" value={value.city} onChange={(e) => onChange('city', e.target.value)} aria-invalid={!!errors.city} />
      </Field>
      <Field label="State *" error={errors.state}>
        <select className="field" autoComplete="shipping address-level1" value={value.state} onChange={(e) => onChange('state', e.target.value)} aria-invalid={!!errors.state}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="PIN code *" error={errors.pincode}>
        <input
          inputMode="numeric"
          className="field"
          autoComplete="shipping postal-code"
          maxLength={6}
          value={value.pincode}
          onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={!!errors.pincode}
        />
      </Field>
      <Field label="Country">
        <input className="field text-muted" value="India" disabled />
      </Field>
    </div>
  );
}
