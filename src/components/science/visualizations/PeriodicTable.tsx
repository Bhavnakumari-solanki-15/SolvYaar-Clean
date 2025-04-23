import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PeriodicTable() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Periodic Table of Elements</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
          <div className="aspect-[16/9]">
            <img
              src="https://www.pngkit.com/png/detail/230-2308491_download-images-periodic-table-of-the-elements-hd.png"
              alt="Periodic Table of Elements"
              className="w-full h-full object-contain"
              style={{
                maxHeight: "600px",
                backgroundColor: "#ffffff"
              }}
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          <p>Interactive features coming soon!</p>
        </div>
      </CardContent>
    </Card>
  );
} 