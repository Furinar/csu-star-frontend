"use client";

import { Input, ConfigProvider } from "antd";
import type { GetProps } from "antd";

const { Search } = Input;
type SearchProps = GetProps<typeof Input.Search>;

const onSearch: SearchProps["onSearch"] = (value, _e, info) =>
  console.log(info?.source, value);

export default function HomeSearchBar() {
  return (
    <div className="flex justify-center w-full z-10 transition-all duration-300 pt-2 md:pt-4 pointer-events-auto">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "var(--first-color)",
            borderRadius: 24,
            colorBgContainer: "var(--container-color)",
            colorBorder: "var(--border)",
            colorTextPlaceholder: "var(--card-foreground)",
            colorText: "var(--text-color)",
            colorIcon: "var(--text-color-light)",
            colorIconHover: "var(--first-color)",
          },
          components: {
            Input: {
              activeShadow: "0 0 0 2px var(--first-color-lighter)",
              paddingBlockLG: 8,
              paddingInlineLG: 20,
              inputFontSizeLG: 15,
              controlHeightLG: 42,
              hoverBorderColor: "var(--first-color)",
              activeBorderColor: "var(--first-color)",
            },
            Button: {
              controlHeightLG: 42,
              paddingInlineLG: 24,
              colorPrimary: "var(--first-color)",
              colorPrimaryHover: "var(--first-color-alt)",
              colorPrimaryActive: "var(--first-color-alt)",
            },
          },
        }}
      >
        <Search
          placeholder="搜索课程资源 / 老师"
          allowClear
          enterButton="Search"
          size="large"
          onSearch={onSearch}
          style={{ borderRadius: 24 }}
          className="w-full sm:w-full max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-xl lg:max-w-2xl shadow-sm hover:shadow-md transition-shadow duration-300 mx-auto overflow-hidden"
        />
      </ConfigProvider>
    </div>
  );
}
