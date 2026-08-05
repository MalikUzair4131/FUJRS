"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ImageGalleryUpload } from "@/components/ui/ImageGalleryUpload";
import {
  PRODUCT_GENDERS,
  type NewCatalogItem,
  type ProductGender,
  type UploadedImage,
} from "@/lib/data";

const MIN_DESCRIPTION_LENGTH = 10;

/** What fabric pieces are sold as. Made-up garments override this. */
const DEFAULT_SIZES = "Unstitched";

const emptyForm = {
  title: "",
  price: "",
  compareAtPrice: "",
  fabric: "",
  category: "",
  gender: "Women" as ProductGender,
  color: "",
  sizes: DEFAULT_SIZES,
  stock: "",
  sku: "",
  description: "",
  isNewArrival: false,
  stitchingEligible: false,
  stitchingAddOn: "",
  badge: "",
  meters: "",
  embroidery: "",
  dupattaInfo: "",
  heritageStory: "",
};

type Form = typeof emptyForm;
type FormErrors = Partial<Record<keyof Form, string>>;

/** "S, M, L" → ["S","M","L"], dropping blanks from a trailing comma. */
const parseSizes = (value: string) =>
  value
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);

/** An optional text field: empty means "not set", not an empty string. */
const optional = (value: string) => value.trim() || null;

function validate(form: Form): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Give the piece a name.";

  const price = Number(form.price);
  if (!form.price.trim()) errors.price = "Enter a price.";
  else if (!Number.isFinite(price) || price <= 0) errors.price = "Price must be above zero.";

  // The database enforces compare_at >= price; catching it here explains why.
  if (form.compareAtPrice.trim()) {
    const compareAt = Number(form.compareAtPrice);
    if (!Number.isFinite(compareAt) || compareAt <= 0) {
      errors.compareAtPrice = "Enter a number, or leave it blank.";
    } else if (Number.isFinite(price) && compareAt <= price) {
      errors.compareAtPrice = "The was-price has to be higher than the price.";
    }
  }

  if (!form.fabric.trim()) errors.fabric = "Name the fabric.";
  if (!form.category.trim()) errors.category = "Choose a category.";
  if (!form.color.trim()) errors.color = "Name the colour — the catalogue filters on it.";

  if (parseSizes(form.sizes).length === 0) {
    errors.sizes = `At least one, e.g. “${DEFAULT_SIZES}”.`;
  }

  const stock = Number(form.stock);
  if (!form.stock.trim()) errors.stock = "Enter the stock count (0 is fine).";
  else if (!Number.isInteger(stock) || stock < 0) errors.stock = "A whole number, zero or more.";

  if (form.stitchingEligible) {
    const addOn = Number(form.stitchingAddOn);
    if (!form.stitchingAddOn.trim()) errors.stitchingAddOn = "Enter the stitching charge.";
    else if (!Number.isFinite(addOn) || addOn < 0) errors.stitchingAddOn = "Zero or more.";
  }

  if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `At least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }
  return errors;
}

/** A labelled group inside the form — the form itself owns the outer border. */
function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-8 border-t border-outline-variant pt-6">
      <legend className="sr-only">{title}</legend>
      <p className="font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
        {title}
      </p>
      {hint && <p className="mt-1 font-body text-label-sm text-text-muted">{hint}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CheckboxField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <span>
        <span className="font-body text-body-md">{label}</span>
        <span className="block font-label-sm text-label-sm text-text-muted">{hint}</span>
      </span>
    </label>
  );
}

/**
 * One product form for both paths — a Vendor submitting for review and an
 * Admin publishing directly. Only the copy on the submit button differs.
 *
 * It collects every column the storefront renders, not just the summary the
 * dashboard table shows: a piece published without a colour or size can't be
 * filtered, and one without stock can't be bought.
 */
export function ProductForm({
  submitLabel,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  onSubmit: (item: NewCatalogItem) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      title: form.title.trim(),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice.trim() ? Number(form.compareAtPrice) : null,
      fabric: form.fabric.trim(),
      category: form.category.trim(),
      gender: form.gender,
      color: form.color.trim(),
      sizes: parseSizes(form.sizes),
      stock: Number(form.stock),
      sku: optional(form.sku),
      description: form.description.trim(),
      isNewArrival: form.isNewArrival,
      stitchingEligible: form.stitchingEligible,
      stitchingAddOn: form.stitchingEligible ? Number(form.stitchingAddOn) : null,
      badge: optional(form.badge),
      meters: optional(form.meters),
      embroidery: optional(form.embroidery),
      dupattaInfo: optional(form.dupattaInfo),
      heritageStory: optional(form.heritageStory),
      images,
    });

    setForm(emptyForm);
    setImages([]);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-outline-variant p-8">
      <ImageGalleryUpload images={images} onChange={setImages} />

      <Group title="The piece">
        <TextField
          label="Product Name"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          error={errors.title}
          placeholder="Emerald Silk Unstitched Set"
        />
        <TextField
          label="Fabric"
          value={form.fabric}
          onChange={(e) => update("fabric", e.target.value)}
          error={errors.fabric}
          placeholder="Raw Silk"
        />
        <TextField
          label="Category"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          error={errors.category}
          placeholder="3-Piece Suits"
        />
        <TextField
          label="Colour"
          value={form.color}
          onChange={(e) => update("color", e.target.value)}
          error={errors.color}
          placeholder="Emerald"
        />
        <SelectField
          label="Gender"
          value={form.gender}
          onChange={(e) => update("gender", e.target.value as ProductGender)}
        >
          {PRODUCT_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Sizes"
          value={form.sizes}
          onChange={(e) => update("sizes", e.target.value)}
          error={errors.sizes}
          hint="Comma-separated. Unstitched fabric is sold as one size."
          placeholder="Unstitched"
        />
        <div className="sm:col-span-2">
          <TextAreaField
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            error={errors.description}
            hint="Fabric weight, finish, and what makes the piece distinct."
          />
        </div>
      </Group>

      <Group title="Price & stock">
        <TextField
          label="Price (PKR)"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
          error={errors.price}
          placeholder="24500"
        />
        <TextField
          label="Was Price (PKR)"
          inputMode="numeric"
          value={form.compareAtPrice}
          onChange={(e) => update("compareAtPrice", e.target.value)}
          error={errors.compareAtPrice}
          hint="Optional — shown struck through beside the price."
          placeholder="32000"
        />
        <TextField
          label="Stock"
          inputMode="numeric"
          value={form.stock}
          onChange={(e) => update("stock", e.target.value)}
          error={errors.stock}
          hint="Units on hand. Zero publishes the piece as out of stock."
          placeholder="12"
        />
        <TextField
          label="SKU"
          value={form.sku}
          onChange={(e) => update("sku", e.target.value)}
          error={errors.sku}
          hint="Optional, but must be unique across the catalogue."
          placeholder="FJ-EM-001"
        />
      </Group>

      <Group title="Stitching">
        <div className="sm:col-span-2">
          <CheckboxField
            label="Offer bespoke stitching for this piece"
            hint="Adds the stitching option to the product page and the bag."
            checked={form.stitchingEligible}
            onChange={(checked) => update("stitchingEligible", checked)}
          />
        </div>
        {form.stitchingEligible && (
          <TextField
            label="Stitching Charge (PKR)"
            inputMode="numeric"
            value={form.stitchingAddOn}
            onChange={(e) => update("stitchingAddOn", e.target.value)}
            error={errors.stitchingAddOn}
            hint="Added to the price when the customer chooses stitching."
            placeholder="6500"
          />
        )}
      </Group>

      <Group
        title="Product page details"
        hint="All optional — each one fills a row in the specs panel on the product page."
      >
        <div className="sm:col-span-2">
          <CheckboxField
            label="Show in New Arrivals"
            hint="Features the piece on the homepage and the New Arrivals page."
            checked={form.isNewArrival}
            onChange={(checked) => update("isNewArrival", checked)}
          />
        </div>
        <TextField
          label="Badge"
          value={form.badge}
          onChange={(e) => update("badge", e.target.value)}
          hint="Short label on the card, e.g. “Limited Edition”."
          placeholder="Limited Edition"
        />
        <TextField
          label="Meters"
          value={form.meters}
          onChange={(e) => update("meters", e.target.value)}
          placeholder="3.5m shirt, 2.5m trouser"
        />
        <TextField
          label="Embroidery"
          value={form.embroidery}
          onChange={(e) => update("embroidery", e.target.value)}
          placeholder="Hand-worked tilla on neckline and sleeves"
        />
        <TextField
          label="Dupatta"
          value={form.dupattaInfo}
          onChange={(e) => update("dupattaInfo", e.target.value)}
          placeholder="Scalloped-edge organza, 2.5m"
        />
        <div className="sm:col-span-2">
          <TextAreaField
            label="Heritage Story"
            rows={3}
            value={form.heritageStory}
            onChange={(e) => update("heritageStory", e.target.value)}
            hint="The craft behind the piece — where it was made and by whom."
          />
        </div>
      </Group>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
