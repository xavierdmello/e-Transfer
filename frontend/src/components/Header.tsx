import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Spinner,
  Link,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Text,
  Box,
  Image,
  Flex,
  Spacer,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import et from "../assets/et.png";
import back from "../assets/back.png";
import settings from "../assets/settings.png";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronLeftIcon, EditIcon } from "@chakra-ui/icons";

function Header({ setMenu, menu }: { setMenu: (arg0: string) => void; menu: string }) {
  const { logout, authenticated, ready, user } = usePrivy();

  async function handleBack() {
    if (menu === "sendMoney" || menu === "receiveMoney") {
      await logout();
    } else if (menu === "settings") {
      setMenu("sendMoney");
    }
  }

  async function handleSettingsButton() {
    if (menu === "settings") {
      setMenu("sendMoney");
    } else {
      setMenu("settings");
    }
  }

  useEffect(() => {
    if (ready && !authenticated) {
      setMenu("landing");
    } else if (ready && authenticated && user?.wallet && menu === "landing") {
      setMenu("sendMoney");
    }
  }, [ready, authenticated, user]);

  return (
    <Box backgroundColor={"brand"} borderTopRadius={"3xl"}>
      <Flex direction={"row"} width={"100%"} verticalAlign={"true"} alignItems={"center"} pl={"20px"} pr={"20px"}>
        {menu !== "landing" && (
          <Button variant={"link"} onClick={handleBack}>
            <ChevronLeftIcon color={"white"} boxSize={10} />
          </Button>
        )}

        <Spacer />
        <Link href="https://github.com/xavierdmello/e-Transfer" isExternal>
          <Image src={et} boxSize={"100px"} objectFit={"contain"} padding={"0px"} height={"80px"} />
        </Link>

        <Spacer />
        {menu !== "landing" && (
          <Button variant={"link"} onClick={() => handleSettingsButton()}>
            <EditIcon color={"white"} boxSize={10} padding={"5px"} />
          </Button>
        )}
      </Flex>
    </Box>
  );
}

export default Header;
