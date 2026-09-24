import { FormEvent, useState } from 'react';
import { Household, clearHousehold, saveHousehold, useHousehold } from './household';

type YesNo = 'yes' | 'no' | '';

const toYesNo = (v?: boolean): YesNo => (v === undefined ? '' : v ? 'yes' : 'no');
const fromYesNo = (v: YesNo) => (v === '' ? undefined : v === 'yes');

function Choice<T extends string>({
  name, legend, value, options, onChange,
}: {
  name: string; legend: string; value: T | ''; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <fieldset className="cn-field">
      <legend>{legend}</legend>
      <div className="cn-choices">
        {options.map(([v, label]) => (
          <label key={v}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function HouseholdDialog({ onDone }: { onDone: () => void }) {
  const current = useHousehold();
  const [zip, setZip] = useState(current.zip ?? '');
  const [housing, setHousing] = useState<NonNullable<Household['housing']> | ''>(current.housing ?? '');
  const [drives, setDrives] = useState<YesNo>(toYesNo(current.drives));
  const [heat, setHeat] = useState<NonNullable<Household['heat']> | ''>(current.heat ?? '');
  const [rx, setRx] = useState<YesNo>(toYesNo(current.prescriptions));
  const [kids, setKids] = useState<YesNo>(toYesNo(current.kids));
  const [benefits, setBenefits] = useState<YesNo>(toYesNo(current.benefits));
  const zipValid = zip === '' || /^\d{5}$/.test(zip);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!zipValid) return;
    const h: Household = {};
    if (zip) h.zip = zip;
    if (housing) h.housing = housing;
    if (heat) h.heat = heat;
    if (fromYesNo(drives) !== undefined) h.drives = fromYesNo(drives);
    if (fromYesNo(rx) !== undefined) h.prescriptions = fromYesNo(rx);
    if (fromYesNo(kids) !== undefined) h.kids = fromYesNo(kids);
    if (fromYesNo(benefits) !== undefined) h.benefits = fromYesNo(benefits);
    saveHousehold(h);
    onDone();
  };

  return (
    <form method="dialog" onSubmit={submit}>
      <h2 id="household-title">Your household</h2>
      <p className="cn-note" style={{ marginTop: 0 }}>
        Answer what you like and skip the rest. This stays on this device. Canairy never sees it.
      </p>

      <div className="cn-field">
        <label htmlFor="zip">ZIP code, for local weather alerts</label>
        <input
          id="zip" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={5}
          value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          aria-invalid={!zipValid} aria-describedby="zip-help"
        />
        <span id="zip-help" className="cn-note">{zipValid ? 'Five digits.' : 'Enter a five-digit ZIP code.'}</span>
      </div>

      <Choice name="housing" legend="Do you rent or own?" value={housing} onChange={setHousing}
        options={[['rent', 'Rent'], ['own', 'Own'], ['other', 'Other']]} />
      <Choice name="drives" legend="Do you drive to work or school?" value={drives} onChange={setDrives}
        options={[['yes', 'Yes'], ['no', 'No']]} />
      <Choice name="heat" legend="How do you heat your home?" value={heat} onChange={setHeat}
        options={[['gas', 'Natural gas'], ['electric', 'Electric'], ['oil', 'Oil or propane'], ['unsure', 'Not sure']]} />
      <Choice name="rx" legend="Does anyone take a daily prescription?" value={rx} onChange={setRx}
        options={[['yes', 'Yes'], ['no', 'No']]} />
      <Choice name="kids" legend="Kids at home?" value={kids} onChange={setKids}
        options={[['yes', 'Yes'], ['no', 'No']]} />
      <Choice name="benefits" legend="Getting SNAP, WIC, Medicaid or similar help?" value={benefits} onChange={setBenefits}
        options={[['yes', 'Yes'], ['no', 'No']]} />

      <div className="cn-dialog-actions">
        <button type="submit" className="cn-button">Save</button>
        <button type="button" className="cn-button secondary" onClick={onDone}>Cancel</button>
        <button
          type="button" className="cn-link-button" style={{ marginLeft: 'auto' }}
          onClick={() => { clearHousehold(); onDone(); }}
        >
          Forget my answers
        </button>
      </div>
    </form>
  );
}
