"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, Info } from "lucide-react";

export default function HowToMeasurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">How to Measure</h1>
        <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
        <p className="text-slate-600 mt-6 max-w-2xl mx-auto text-lg">
          Follow our simple guide to get the perfect fit for your blinds and curtains.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-amber-600" />
              Inside Mount (Recess)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p>For a clean, built-in look where the blind fits inside the window frame.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Width:</strong> Measure the exact inside width at the top, middle, and bottom. Use the narrowest measurement.</li>
              <li><strong>Drop (Length):</strong> Measure the exact inside length from the top of the recess to the windowsill at the left, middle, and right. Use the longest measurement.</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded-md flex items-start gap-3 mt-4">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">Do not make any deductions. The factory will make the necessary deductions to ensure it fits perfectly without rubbing the sides.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-amber-600" />
              Outside Mount (Exact)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p>For making a window look larger or blocking out maximum light. The blind sits outside the window frame.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Width:</strong> Measure the exact width of where you want the blind to be. We recommend adding at least 10cm to each side (20cm total) past the window frame to minimize light gap.</li>
              <li><strong>Drop (Length):</strong> Measure from where you want the headrail to sit, down to where you want the blind to finish.</li>
            </ul>
            <div className="bg-amber-50 p-4 rounded-md flex items-start gap-3 mt-4">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">We will make the blind to the exact measurements you provide. No deductions will be made.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
