import type { FC } from "react";

import { FlagSelect } from "@workspace/ui/components/flag-select";
import { countries } from "@workspace/ui/lib/countries";

export interface CallingCodeSelectProps {
  name?: string;
  defaultValue?: string;
  className?: string;
}

export const CallingCodeSelect: FC<CallingCodeSelectProps> = (props) => {
  return <FlagSelect options={options} {...props} />;
};

const options = countries.map((country) => ({
  value: country.callingCode,
  code: country.iso2,
  label: `(+${country.callingCode}) ${country.name}`,
  labelShort: `+${country.callingCode}`,
}));
